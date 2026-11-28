/**
 * Ambient music, one playlist per colour mode.
 *
 * - On by default, unless the visitor has switched it off (remembered). Most
 *   browsers refuse to start sound before the visitor has touched the page,
 *   so when playback is blocked the control shows as armed and the first
 *   tap, click or key anywhere starts the music.
 * - While playing, the Media Session carries the track's name and the site
 *   icon, so lock screens and system players show something sensible, and
 *   their play/pause buttons drive the same switch.
 * - Dark loops Darklings (pitch-black.m4a). Light plays the City Sundown intro once, then
 *   its loop, handed over on the intro's `ended` event.
 * - A mode switch is a real crossfade: both tracks sound at once for
 *   MODE_FADE_MS (8s, like every other mode fade) on a raised cosine. On and off fade over TOGGLE_FADE_MS.
 * - Tracks resume where they were paused. A loop that has never played
 *   starts somewhere in its middle, so a track with a silent head (Pitch
 *   Black) never opens on silence.
 * - The mode comes from `data-theme` on <html> when the switch has set it,
 *   otherwise from the system preference. Both are watched.
 *
 * Nothing is downloaded before the first switch-on: the elements are created
 * lazily, so a visitor who never wants sound never pays for 4 MB of audio.
 *
 * Levels are set on a Web Audio gain node per element, not on the element's
 * `volume`: iOS ignores that property, so volume fades there did nothing
 * and a crossfade was two tracks at full level until one stopped. The audio
 * context needs a user gesture on most browsers, which the armed state
 * already provides.
 */
import { attachAnalyser, setProfile } from "~/utils/sky/spectrum";
import { LIBRARY, type AudioFile } from "~/utils/audioLibrary";

type Mode = "light" | "dark";

const STORAGE_KEY = "ub:sound";
const VOLUME = 0.5;
const TOGGLE_FADE_MS = 2500;
const MODE_FADE_MS = 8000; // the same 8s as --mode-fade in main.css
const FADE_STEP_MS = 50;

/**
 * The music comes from the library (app/utils/audioLibrary.ts, generated
 * from the masters by scripts/audio-library.py). Each visit picks one track
 * per mode at random. A dark track is a set of versions of the same piece:
 * one plays, and eight seconds before its end another version comes in
 * at a random point and takes over on a crossfade, so the music never
 * stops and never restarts; a track with a single version simply loops. A
 * light track is a first play followed by a loop that joins it seamlessly.
 */
type Meta = { title: string; album: string; file: AudioFile; versions?: HTMLAudioElement[] };
const meta = new WeakMap<HTMLAudioElement, Meta>();
const handed = new WeakSet<HTMLAudioElement>(); // dark versions that have passed the baton
const HANDOFF_S = 8; // seconds before a version's end that the next one comes in
const pick = <T>(list: T[], not?: T): T => {
  const pool = list.length > 1 && not !== undefined ? list.filter((x) => x !== not) : list;
  return pool[(Math.random() * pool.length) | 0]!;
};
const ARTIST = "Urs Bollhalder";

// Module state: one player for the whole site, whichever component asks.
let players: Record<Mode, HTMLAudioElement[]> | undefined;
let active: Record<Mode, HTMLAudioElement> | undefined; // where each mode resumes
let current: HTMLAudioElement | undefined;
let watching = false;
let armed = false; // waiting for the first gesture because autoplay was blocked
const RESUME_WAIT_MS = 800; // how long a blocked audio context may keep us waiting
// Every transition bumps this; a step that awaited something checks it is
// still the latest before touching anything, so quick toggles cannot interleave.
let session = 0;
const played = new WeakSet<HTMLAudioElement>(); // has started at least once
// Where the element's own volume works, that is what the fades drive: it is
// the one path every desktop browser gets right, and it keeps clear of a
// Safari fault where an element routed into a graph made while playback was
// blocked plays straight to the output, past the gain, at full level. Only
// where the volume property is ignored (iOS) does a gain node per element
// take over. The graph is built either way, for the sky's analyser.
let ctx: AudioContext | undefined;
let volumeWorks: boolean | undefined;
const probeVolume = () => {
  if (volumeWorks === undefined) {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeWorks = probe.volume === 0.5;
  }
  return volumeWorks;
};
let analyser: AnalyserNode | undefined; // after the gains: the sky reads what is heard
const gains = new WeakMap<HTMLAudioElement, GainNode>();
const level = (el: HTMLAudioElement) => gains.get(el)?.gain.value ?? el.volume;
const setLevel = (el: HTMLAudioElement, v: number) => {
  const g = gains.get(el);
  if (g && ctx) {
    // glide to the new step rather than jump, so a fade is not a staircase
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setTargetAtTime(v, ctx.currentTime, FADE_STEP_MS / 1000 / 3);
  } else el.volume = v; // no Web Audio: the element's own volume, as before
};
const randomStart = new WeakSet<HTMLAudioElement>(); // loops that open on silence
// One running fade per element, with its resolver so a cancelled fade settles
// at once instead of leaving its caller hanging.
const fades = new WeakMap<
  HTMLAudioElement,
  { timer: ReturnType<typeof setInterval>; resolve: () => void }
>();

const readMode = (): Mode => {
  const attr = document.documentElement.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const buildPlayers = (base: string) => {
  const make = (file: AudioFile, loop: boolean, m: Omit<Meta, "file">) => {
    const el = new Audio(base + file.src);
    el.loop = loop;
    el.preload = "none"; // fetched only once it is about to play
    if ("AudioContext" in window) {
      ctx ??= new AudioContext();
      if (!analyser) {
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5; // low enough that a kick is a step, not a slope
        analyser.connect(ctx.destination);
        attachAnalyser(analyser);
      }
      const gain = ctx.createGain();
      ctx.createMediaElementSource(el).connect(gain).connect(analyser);
      if (probeVolume()) {
        gain.gain.value = 1; // the element's volume does the fading
        el.volume = 0;
      } else {
        gain.gain.value = 0; // iOS: the gain does, the element stays at full
        gains.set(el, gain);
      }
    } else {
      el.volume = 0;
    }
    meta.set(el, { ...m, file });
    return el;
  };

  // dark: a random track, all its versions; one version loops on its own
  const dark = pick(LIBRARY.dark);
  const single = dark.versions.length === 1;
  const versions = dark.versions.map((f) =>
    make(f, single, { title: dark.title, album: dark.album }),
  );
  for (const el of versions) {
    meta.get(el)!.versions = versions;
    if (single) {
      randomStart.add(el); // a loop with a silent head never opens on it
      continue;
    }
    // the baton: shortly before the end, another version comes in somewhere
    // in its middle and the two cross over, which is as good as unnoticed
    el.addEventListener("timeupdate", () => {
      if (current !== el || handed.has(el) || !el.duration) return;
      if (el.duration - el.currentTime > HANDOFF_S) return;
      handed.add(el);
      const next = pick(versions, el);
      void (async () => {
        await ready(next);
        next.currentTime = (0.2 + 0.4 * Math.random()) * next.duration;
        active!.dark = next;
        await transition(next, HANDOFF_S * 1000);
      })();
    });
    el.addEventListener("ended", () => handed.delete(el)); // may take the baton again later
    el.addEventListener(
      "playing",
      () => versions.forEach((v) => v !== el && (v.preload = "auto")),
      {
        once: true,
      },
    );
  }

  // light: a random track, its first play then its loop, joined on `ended`
  const light = pick(LIBRARY.light);
  const intro = make(light.intro, false, { title: light.title, album: light.album });
  const loop = make(light.loop, true, { title: light.title, album: light.album });
  intro.addEventListener("playing", () => (loop.preload = "auto"), { once: true });
  intro.addEventListener("ended", () => {
    active!.light = loop;
    if (current === intro) void transition(loop, 0); // straight in, the files are cut to join
  });

  const built = { dark: versions, light: [intro, loop] };
  active = { dark: versions[0]!, light: intro };
  if (import.meta.dev) {
    const w = window as unknown as { __ambient: typeof built; __ambientLevel: typeof level };
    w.__ambient = built;
    w.__ambientLevel = level;
  }
  return built;
};

const cancelFade = (el: HTMLAudioElement) => {
  const running = fades.get(el);
  if (!running) return;
  clearInterval(running.timer);
  fades.delete(el);
  running.resolve();
};

/**
 * Ramp the element's level to `target` over `ms` on a raised cosine: the
 * outgoing track is at half by the middle and eases to nothing with no
 * slope at the end, the incoming one mirrors it. An equal-power curve was
 * tried first and sounded wrong: amplitude is not loudness, so the outgoing
 * track stayed near full until the last stretch and then broke off.
 * Resolves when done or when cancelled.
 */
const fade = (el: HTMLAudioElement, target: number, ms: number) =>
  new Promise<void>((resolve) => {
    cancelFade(el);
    if (ms <= 0) {
      setLevel(el, target);
      return resolve();
    }
    const from = level(el);
    const t0 = performance.now();
    const shape = (p: number) => (1 - Math.cos(p * Math.PI)) / 2;
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      setLevel(el, from + (target - from) * shape(p));
      if (p >= 1) cancelFade(el); // clears the timer and resolves
    }, FADE_STEP_MS);
    fades.set(el, { timer, resolve });
  });

/** Pause everything and zero every level; positions are kept for resuming. */
const silenceAll = () => {
  if (!players) return;
  for (const el of [...players.dark, ...players.light]) {
    cancelFade(el);
    el.pause();
    setLevel(el, 0);
  }
};

/** Resolves once the element knows its duration. */
const ready = (el: HTMLAudioElement) =>
  new Promise<void>((resolve) => {
    if (el.readyState >= 1) return resolve();
    el.addEventListener("loadedmetadata", () => resolve(), { once: true });
    el.preload = "metadata";
    el.load();
  });

/** Start or resume `el`. A never-played loop with a silent head starts mid-track. */
const play = async (el: HTMLAudioElement) => {
  if (!played.has(el) && randomStart.has(el)) {
    await ready(el);
    el.currentTime = (0.15 + 0.7 * Math.random()) * el.duration;
  }
  played.add(el);
  // The context starts suspended until a gesture on most browsers, and
  // Firefox and Safari leave resume() hanging until one comes, so the wait
  // gets a deadline. A context still suspended after it would play nothing,
  // and that counts as blocked: the armed state takes over.
  if (ctx && ctx.state !== "running") {
    await Promise.race([
      ctx.resume().catch(() => undefined),
      new Promise((r) => setTimeout(r, RESUME_WAIT_MS)),
    ]);
    if ((ctx.state as AudioContextState) !== "running")
      throw new DOMException("audio context suspended", "NotAllowedError");
  }
  await el.play(); // throws NotAllowedError without a user gesture
  const m = meta.get(el);
  if (m) setProfile(m.file.profile, VOLUME); // the sky reads this file by its own measure
};

/**
 * Make `to` the playing element, crossfading from whatever plays now over
 * `ms`. Rejects if the browser blocks playback.
 */
const transition = async (to: HTMLAudioElement, ms: number) => {
  const mine = ++session;
  const from = current;
  current = to;
  if (from === to) {
    // already on it: a second attempt for the same track (a press and its
    // click both count as the first gesture) must still see it faded in,
    // since the attempt it replaced was cut off before its fade
    if (to.paused) await play(to);
    if (mine === session) await fade(to, VOLUME, ms);
    return;
  }
  setLevel(to, 0);
  await play(to);
  if (mine !== session) return; // something newer took over meanwhile
  await Promise.all([
    fade(to, VOLUME, ms),
    from && fade(from, 0, ms).then(() => mine === session && from.pause()),
  ]);
};

/** Fade the current element out, then make sure nothing is left playing. */
const stop = async (ms: number) => {
  const mine = ++session;
  const el = current;
  current = undefined;
  if (el) await fade(el, 0, ms);
  if (mine === session) silenceAll();
};

export const useAmbientAudio = () => {
  // shared between every caller, and safe to read during SSR
  const enabled = useState("ambient-sound", () => false);
  // on, but silent until the visitor's first gesture (autoplay was blocked)
  const pending = useState("ambient-sound-pending", () => false);
  const nowPlaying = useState<string>("ambient-sound-track", () => ""); // for the radio display
  const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");

  const resumePoint = () => {
    players ??= buildPlayers(base);
    return active![readMode()];
  };

  /** What lock screens and system players show while the music plays. */
  const announce = (el: HTMLAudioElement) => {
    if (!("mediaSession" in navigator)) return;
    const m = meta.get(el);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: m?.title ?? "",
      artist: ARTIST,
      album: m?.album ?? "",
      artwork: [
        { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png" },
        { src: `${base}/icon-1024.png`, sizes: "1024x1024", type: "image/png" },
      ],
    });
    navigator.mediaSession.playbackState = "playing";
  };

  // Every attempt is numbered: one that lost to a newer attempt (a gesture
  // came while it was still waiting) must not mark the light as blocked.
  let attempt = 0;
  const switchOn = async (ms = TOGGLE_FADE_MS) => {
    const mine = ++attempt;
    enabled.value = true; // the button answers at once, not after the fade
    // the gesture listeners go on before the attempt, not after it fails:
    // a click during the first seconds, while the file still loads or the
    // browser still thinks about it, is a gesture too and must not be lost
    arm();
    try {
      const to = resumePoint();
      const going = transition(to, ms);
      // the display turns over as soon as the new track is audible, not when
      // the crossfade has finished; while armed the prompt covers it anyway
      to.addEventListener(
        "playing",
        () => {
          pending.value = false; // the light stops waiting the moment sound is there
          const m = meta.get(to);
          nowPlaying.value = m ? `${m.title} · ${m.album}` : "";
          disarm();
        },
        { once: true },
      );
      await going;
      if (mine !== attempt) return;
      pending.value = false;
      disarm();
      announce(to);
      localStorage.setItem(STORAGE_KEY, "on");
    } catch {
      if (mine !== attempt) return; // a newer attempt is on it
      // autoplay blocked: stay on, and let the first gesture anywhere start it
      current = undefined;
      pending.value = true;
    }
  };

  const switchOff = async () => {
    enabled.value = false;
    pending.value = false;
    nowPlaying.value = "";
    localStorage.setItem(STORAGE_KEY, "off");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    await stop(TOGGLE_FADE_MS);
  };

  // The first gesture anywhere retries. A click on the sound control itself
  // is left to the control, whose toggle also starts an armed light.
  // every event a browser counts as activation: pointerdown for a mouse,
  // pointerup and touchend for a finger, keydown, and click as the one all
  // of them agree on
  const GESTURES = ["pointerdown", "pointerup", "touchend", "keydown", "click"] as const;
  const onGesture = (e: Event) => {
    if ((e.target as Element | null)?.closest?.(".sound-toggle")) return;
    if (!enabled.value) return disarm();
    if (current && !current.paused) return disarm(); // already sounding
    // the context must be resumed inside the gesture, before any await;
    // the listeners stay on until a start succeeds, so the click event of
    // the same press can retry if its pointerdown was not enough
    if (ctx && ctx.state !== "running") void ctx.resume().catch(() => undefined);
    void switchOn();
  };
  const arm = () => {
    if (armed) return;
    armed = true;
    for (const type of GESTURES) addEventListener(type, onGesture, { passive: true });
  };
  const disarm = () => {
    if (!armed) return;
    armed = false;
    for (const type of GESTURES) removeEventListener(type, onGesture);
  };

  // an armed light clicked starts the music: the click is the gesture it waits for
  const toggle = () => (enabled.value && !pending.value ? switchOff() : switchOn());

  // A mode change while playing: crossfade to the other playlist.
  const onModeChange = () => {
    if (enabled.value) void switchOn(MODE_FADE_MS);
  };

  onMounted(() => {
    if (watching) return;
    watching = true;
    new MutationObserver(onModeChange).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onModeChange);
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => void switchOn());
      navigator.mediaSession.setActionHandler("pause", () => void switchOff());
    }
    let wanted = true; // on by default
    try {
      wanted = localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      /* storage blocked: treat as a first visit */
    }
    if (wanted) void switchOn();
  });

  return { enabled, pending, nowPlaying, toggle, artist: ARTIST };
};
