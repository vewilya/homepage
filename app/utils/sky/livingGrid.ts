import type { Effect, Frame } from "./types";
import { LATTICE, hash2 } from "./types";

/**
 * The one dot lattice behind the page.
 *
 * Ambient: every cell blinks on its own slow sine, and drifting patches make
 * neighbours wake together, so the activity wanders across the screen like
 * film grain snapped to a grid. The same in both modes; only the colour
 * follows the mode crossfade, the day side a little stronger over the veil.
 *
 * Music: the grain is the music's. In silence the grid is dark; the loudness
 * brings it up, so the grain breathes with the track; by day the dots also
 * warm from navy towards the sun's red-orange as it gets loud, while the
 * night's cream stays cream.
 */
export type LivingGridOptions = {
  spacing?: number;
  size?: number;
  maxAlpha?: number; // brightest an ambient dot gets at night
  maxAlphaLight?: number; // and by day, over the cream veil
  minSpeed?: number; // rad/s: a cell blinks once per (2π / speed) seconds
  maxSpeed?: number;
  musicGain?: number; // the grain's floor while music plays, 0..1; it rises to 1 with the level
};

/** Dev reading: the music's presence the grid is drawn at. */
export const debug = { level: 0 };

export const createLivingGrid = (o: LivingGridOptions = {}): Effect => {
  const spacing = o.spacing ?? LATTICE.spacing;
  const size = o.size ?? LATTICE.size;
  const maxAlpha = o.maxAlpha ?? 0.45;
  const maxAlphaLight = o.maxAlphaLight ?? 1; // navy on a bright picture needs all of it
  const minSpeed = o.minSpeed ?? 0.3;
  const maxSpeed = o.maxSpeed ?? 1.0;
  const musicGain = o.musicGain ?? 0.3;

  let cols = 0;
  let rows = 0;
  let phase = new Float32Array(0);
  let speed = new Float32Array(0);

  const resize = (width: number, height: number) => {
    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;
    const n = cols * rows;
    phase = new Float32Array(n);
    speed = new Float32Array(n);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        phase[i] = hash2(x, y) * Math.PI * 2;
        speed[i] = minSpeed + hash2(x + 1000, y) * (maxSpeed - minSpeed);
      }
    }
  };

  const draw = ({ ctx, time, dark, level }: Frame) => {
    debug.level = level;
    // silence: no grain at all; playing, the level is the track's own loudness
    // between its measured floor and peak (spectrum.ts), over a floor of musicGain
    const presence = level < 0.01 ? 0 : Math.min(1, musicGain + (1 - musicGain) * level);
    if (presence <= 0) return;
    const strength = (maxAlphaLight + (maxAlpha - maxAlphaLight) * dark) * presence;
    // cream dots at night; by day navy that warms to the sun's red-orange
    // (#c9461f) the louder the music; the mix follows the mode crossfade
    const warm = Math.pow(level, 1.3) * (1 - dark);
    const mix = (day: number, night: number, hot: number) =>
      Math.round(day * (1 - warm - dark) + hot * warm + night * dark);
    const r = mix(29, 239, 201);
    const g = mix(52, 230, 70);
    const b = mix(73, 214, 31);
    const half = size / 2;
    for (let y = 0; y < rows; y++) {
      // slow drifting patches: one sine in each axis, offset in time
      const py = Math.sin(y * 0.3 - time * 0.11);
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const s = Math.sin(time * speed[i]! + phase[i]!);
        if (s <= 0.6) continue;
        const patch = 0.5 + 0.5 * Math.sin(x * 0.35 + time * 0.15) * py;
        const alpha = Math.pow(s, 6) * patch * patch * strength;
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillRect(x * spacing - half, y * spacing - half, size, size);
      }
    }
  };

  return { resize, draw };
};
