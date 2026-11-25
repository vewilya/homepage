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
type Mode = "light" | "dark";

const STORAGE_KEY = "ub:sound";
const VOLUME = 0.5;
const TOGGLE_FADE_MS = 2500;
const MODE_FADE_MS = 8000; // the same 8s as --mode-fade in main.css
const FADE_STEP_MS = 50;

// One file per step; the loop step repeats, the others play once.
const PLAYLISTS: Record<Mode, { src: string; loop: boolean }[]> = {
  dark: [{ src: "/audio/pitch-black.m4a", loop: true }],
  light: [
    { src: "/audio/city-sundown-intro.m4a", loop: false },
    { src: "/audio/city-sundown-loop.m4a", loop: true },
  ],
};
const TITLES: Record<Mode, string> = { dark: "Darklings", light: "City Sundown" };
const ALBUMS: Record<Mode, string> = {
  dark: "Ghosts in the Machines",
  light: "Soundscapes for Modern Superheroes",
};
const ARTIST = "Urs Bollhalder";

// Module state: one player for the whole site, whichever component asks.
let players: Record<Mode, HTMLAudioElement[]> | undefined;
let active: Record<Mode, HTMLAudioElement> | undefined; // where each mode resumes
let current: HTMLAudioElement | undefined;
let watching = false;
let armed = false; // waiting for the first gesture because autoplay was blocked
// Every transition bumps this; a step that awaited something checks it is
// still the latest before touching anything, so quick toggles cannot interleave.
let session = 0;
const played = new WeakSet<HTMLAudioElement>(); // has started at least once
// one gain node per element, the element itself always at full volume
let ctx: AudioContext | undefined;
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
  const make = (steps: { src: string; loop: boolean }[]) =>
    steps.map((step, i) => {
      const el = new Audio(base + step.src);
      el.loop = step.loop;
      el.preload = "none"; // fetched only once it is about to play
      if ("AudioContext" in window) {
        ctx ??= new AudioContext();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
        gains.set(el, gain);
      } else {
        el.volume = 0;
      }
      if (step.loop && i === 0) randomStart.add(el); // no intro before it
      return el;
    });
  const built = { dark: make(PLAYLISTS.dark), light: make(PLAYLISTS.light) };
  active = { dark: built.dark[0]!, light: built.light[0]! };
  // intro -> loop handoff: warm the next file while this one plays
  for (const [mode, list] of Object.entries(built) as [Mode, HTMLAudioElement[]][]) {
    list.forEach((el, i) => {
      const next = list[i + 1];
      if (!next) return;
      el.addEventListener("playing", () => (next.preload = "auto"), { once: true });
      el.addEventListener("ended", () => {
        active![mode] = next;
        // straight in at full volume, the files are cut to join
        if (current === el) void transition(next, 0);
      });
    });
  }
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
  // the context starts suspended until a gesture on most browsers; a play
  // that succeeds while it stays suspended would be silent, so that counts
  // as blocked too and the armed state takes over
  if (ctx && ctx.state !== "running") await ctx.resume().catch(() => undefined);
  await el.play(); // throws NotAllowedError without a user gesture
  if (ctx && ctx.state !== "running") {
    el.pause();
    throw new DOMException("audio context suspended", "NotAllowedError");
  }
};

/**
 * Make `to` the playing element, crossfading from whatever plays now over
 * `ms`. Rejects if the browser blocks playback.
 */
const transition = async (to: HTMLAudioElement, ms: number) => {
  const mine = ++session;
  const from = current;
  current = to;
  if (from === to) return; // already on it
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
  const announce = (mode: Mode) => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: TITLES[mode],
      artist: ARTIST,
      album: ALBUMS[mode],
      artwork: [
        { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png" },
        { src: `${base}/icon-1024.png`, sizes: "1024x1024", type: "image/png" },
      ],
    });
    navigator.mediaSession.playbackState = "playing";
  };

  const switchOn = async (ms = TOGGLE_FADE_MS) => {
    enabled.value = true; // the button answers at once, not after the fade
    const mode = readMode();
    try {
      const to = resumePoint();
      const going = transition(to, ms);
      // the display turns over as soon as the new track is audible, not when
      // the crossfade has finished; while armed the prompt covers it anyway
      to.addEventListener(
        "playing",
        () => (nowPlaying.value = `${TITLES[mode]} · ${ALBUMS[mode]}`),
        {
          once: true,
        },
      );
      await going;
      pending.value = false;
      announce(mode);
      localStorage.setItem(STORAGE_KEY, "on");
    } catch {
      // autoplay blocked: stay on, and let the first gesture anywhere start it
      current = undefined;
      pending.value = true;
      arm();
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
  // is left to the control: an armed light clicked means "no, thanks".
  const GESTURES = ["pointerdown", "keydown", "touchend"] as const;
  const onGesture = (e: Event) => {
    if ((e.target as Element | null)?.closest?.(".sound-toggle")) return;
    disarm();
    if (enabled.value) void switchOn();
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

  const toggle = () => (enabled.value ? switchOff() : switchOn());

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
