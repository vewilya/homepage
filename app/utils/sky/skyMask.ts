import { MASKS, MASK_COLS, MASK_ROWS } from "./skyMasks";
import { PICTURE_ASPECT, type PictureNames } from "~/utils/pictures";

/**
 * Where the sky is on screen right now.
 *
 * Every picture has a small one-bit mask (skyMasks.ts, from
 * scripts/sky-masks.ts). The pictures are shown `center / cover`, so the
 * same mapping is done here: the picture scaled to cover the window and
 * centred, and a screen point read back into the picture. The mask is
 * sampled bilinearly, which softens the edge by about a cell.
 *
 * Two pictures are up at any time, the mode's two, blended by the mode
 * value the way the stylesheet blends the layers; and on a page change the
 * new pair fades in over the old over the pictures' own crossfade, so the
 * dots never jump to a skyline the eye cannot see yet.
 */
const PAGE_FADE_S = 6; // the .bg-enter-active transition in main.css

type Bits = { data: Uint8Array };
const decoded = new Map<string, Bits>();
const bitsOf = (name: string): Bits | undefined => {
  const cached = decoded.get(name);
  if (cached) return cached;
  const b64 = MASKS[name];
  if (!b64) return undefined;
  const bin = atob(b64);
  const data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  const bits = { data };
  decoded.set(name, bits);
  return bits;
};
const bit = (b: Bits, cx: number, cy: number) => {
  if (cx < 0 || cy < 0 || cx >= MASK_COLS || cy >= MASK_ROWS) return 1; // beyond the picture: sky
  const i = cy * MASK_COLS + cx;
  return (b.data[i >> 3]! >> (7 - (i & 7))) & 1;
};
/** The mask at picture coordinates u, v in 0..1, bilinear. */
const sample = (b: Bits | undefined, u: number, v: number) => {
  if (!b) return 1;
  const fx = u * MASK_COLS - 0.5;
  const fy = v * MASK_ROWS - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const top = bit(b, x0, y0) * (1 - tx) + bit(b, x0 + 1, y0) * tx;
  const bottom = bit(b, x0, y0 + 1) * (1 - tx) + bit(b, x0 + 1, y0 + 1) * tx;
  return top * (1 - ty) + bottom * ty;
};

export const createSkyMask = () => {
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let pair: { light?: Bits; dark?: Bits } = {};
  let previous: typeof pair | undefined;
  let fade = 1; // 0 just after a page change, 1 when the new pair is fully in
  let dark = 0;

  const resize = (width: number, height: number) => {
    // cover: the picture scaled to fill the window, centred
    const pw = PICTURE_ASPECT;
    const ph = 1;
    scale = Math.max(width / pw, height / ph);
    ox = (width - pw * scale) / 2;
    oy = (height - ph * scale) / 2;
  };

  const set = (names: PictureNames) => {
    const next = { light: bitsOf(names.light), dark: bitsOf(names.dark) };
    if (next.light === pair.light && next.dark === pair.dark) return;
    if (pair.light || pair.dark) {
      previous = pair;
      fade = 0;
    }
    pair = next;
  };

  /** Once a frame: advances the page crossfade and takes the mode value. */
  const tick = (dt: number, modeDark: number) => {
    dark = modeDark;
    if (previous) {
      fade = Math.min(1, fade + dt / PAGE_FADE_S);
      if (fade >= 1) previous = undefined;
    }
  };

  const weightOf = (p: typeof pair, u: number, v: number) =>
    sample(p.light, u, v) * (1 - dark) + sample(p.dark, u, v) * dark;

  /** How much sky is under this screen point, 0..1. */
  const weight = (x: number, y: number) => {
    const u = (x - ox) / (PICTURE_ASPECT * scale);
    const v = (y - oy) / scale;
    const w = weightOf(pair, u, v);
    return previous ? weightOf(previous, u, v) * (1 - fade) + w * fade : w;
  };

  return { resize, set, tick, weight };
};

export type SkyMask = ReturnType<typeof createSkyMask>;
