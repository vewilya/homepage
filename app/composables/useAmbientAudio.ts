/**
 * Ambient music, one playlist per colour mode.
 *
 * - Off until the visitor switches it on: browsers refuse to start sound
 *   without a click. The choice is remembered; on the next visit we try to
 *   resume and fall back to "off" if the browser says no.
 * - Dark loops Pitch Black. Light plays the City Sundown intro once, then
 *   its loop, handed over on the intro's `ended` event.
 * - A mode switch is a real crossfade: both tracks sound at once for
 *   MODE_FADE_MS on an equal-power curve. On and off fade over TOGGLE_FADE_MS.
 * - Tracks resume where they were paused. A loop that has never played
 *   starts somewhere in its middle, so a track with a silent head (Pitch
 *   Black) never opens on silence.
 * - The mode comes from `data-theme` on <html> when the switch has set it,
 *   otherwise from the system preference. Both are watched.
 *
 * Nothing is downloaded before the first switch-on: the elements are created
 * lazily, so a visitor who never wants sound never pays for 4 MB of audio.
 */
type Mode = "light" | "dark";

const STORAGE_KEY = "ub:sound";
const VOLUME = 0.5;
const TOGGLE_FADE_MS = 1500;
const MODE_FADE_MS = 5000;
const FADE_STEP_MS = 50;

// One file per step; the loop step repeats, the others play once.
const PLAYLISTS: Record<Mode, { src: string; loop: boolean }[]> = {
  dark: [{ src: "/audio/pitch-black.m4a", loop: true }],
  light: [
    { src: "/audio/city-sundown-intro.m4a", loop: false },
    { src: "/audio/city-sundown-loop.m4a", loop: true },
  ],
};

// Module state: one player for the whole site, whichever component asks.
let players: Record<Mode, HTMLAudioElement[]> | undefined;
let active: Record<Mode, HTMLAudioElement> | undefined; // where each mode resumes
let current: HTMLAudioElement | undefined;
let watching = false;
// Every transition bumps this; a step that awaited something checks it is
// still the latest before touching anything, so quick toggles cannot interleave.
let session = 0;
const played = new WeakSet<HTMLAudioElement>(); // has started at least once
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
      el.volume = 0;
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
  if (import.meta.dev) (window as unknown as { __ambient: typeof built }).__ambient = built;
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
 * Ramp the element's volume to `target` over `ms`. "in" rises on a sine,
 * "out" falls on a cosine, so a crossfade keeps constant power; "plain" is
 * a smoothstep for a lone fade. Resolves when done or when cancelled.
 */
const fade = (el: HTMLAudioElement, target: number, ms: number, curve: "in" | "out" | "plain") =>
  new Promise<void>((resolve) => {
    cancelFade(el);
    if (ms <= 0) {
      el.volume = target;
      return resolve();
    }
    const from = el.volume;
    const t0 = performance.now();
    const shape = (p: number) =>
      curve === "in"
        ? Math.sin((p * Math.PI) / 2)
        : curve === "out"
          ? 1 - Math.cos((p * Math.PI) / 2)
          : p * p * (3 - 2 * p);
    const timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      el.volume = from + (target - from) * shape(p);
      if (p >= 1) cancelFade(el); // clears the timer and resolves
    }, FADE_STEP_MS);
    fades.set(el, { timer, resolve });
  });

/** Pause everything and zero every volume; positions are kept for resuming. */
const silenceAll = () => {
  if (!players) return;
  for (const el of [...players.dark, ...players.light]) {
    cancelFade(el);
    el.pause();
    el.volume = 0;
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
  await el.play(); // throws NotAllowedError without a user gesture
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
  to.volume = 0;
  await play(to);
  if (mine !== session) return; // something newer took over meanwhile
  await Promise.all([
    fade(to, VOLUME, ms, from ? "in" : "plain"),
    from && fade(from, 0, ms, "out").then(() => mine === session && from.pause()),
  ]);
};

/** Fade the current element out, then make sure nothing is left playing. */
const stop = async (ms: number) => {
  const mine = ++session;
  const el = current;
  current = undefined;
  if (el) await fade(el, 0, ms, "plain");
  if (mine === session) silenceAll();
};

export const useAmbientAudio = () => {
  // shared between every caller, and safe to read during SSR
  const enabled = useState("ambient-sound", () => false);
  const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");

  const resumePoint = () => {
    players ??= buildPlayers(base);
    return active![readMode()];
  };

  const switchOn = async (ms = TOGGLE_FADE_MS) => {
    enabled.value = true; // the button answers at once, not after the fade
    try {
      await transition(resumePoint(), ms);
      localStorage.setItem(STORAGE_KEY, "on");
    } catch {
      enabled.value = false; // autoplay blocked: wait for a click
      current = undefined;
    }
  };

  const switchOff = async () => {
    enabled.value = false;
    localStorage.setItem(STORAGE_KEY, "off");
    await stop(TOGGLE_FADE_MS);
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
    try {
      if (localStorage.getItem(STORAGE_KEY) === "on") void switchOn();
    } catch {
      /* storage blocked: start silent */
    }
  });

  return { enabled, toggle };
};
