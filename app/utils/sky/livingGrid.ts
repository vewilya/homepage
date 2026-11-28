import type { Effect, Frame } from "./types";
import { LATTICE, hash2 } from "./types";

/**
 * The one dot lattice behind the page.
 *
 * Ambient: every cell blinks on its own slow sine, and drifting patches make
 * neighbours wake together, so the activity wanders across the screen like
 * film grain snapped to a grid. The same in both modes; only the colour
 * follows the mode crossfade: cream at night, by day the muted ink at half
 * the strength, so the dots sit in the picture instead of on it.
 *
 * Music: the grain is the music's. In silence the grid is dark; the loudness
 * brings it up, so the grain breathes with the track; by day the dots also
 * warm from navy towards the sun's red-orange as it gets loud, while the
 * night's cream stays cream. A hit below, a kick or a bass note, is a pulse:
 * the dots swell, brighten and glow red for a moment in both modes. A hit
 * above, a hi-hat or a click, is a sparkle: a scatter of cells flash bright
 * and are gone.
 */
export type LivingGridOptions = {
  spacing?: number;
  size?: number;
  maxAlpha?: number; // brightest an ambient dot gets at night
  maxAlphaLight?: number; // and by day, over the cream veil
  minSpeed?: number; // rad/s: a cell blinks once per (2π / speed) seconds
  maxSpeed?: number;
  musicGain?: number; // the grain's floor while music plays, 0..1; it rises to 1 with the level
  pulse?: number; // how far a low hit swells a dot, as a share of its size
  glow?: number; // how far a low hit warms the dots towards the accent, 0..1
  sparkle?: number; // share of cells a full high hit lights, 0..1
};

/** Dev reading: the music's presence the grid is drawn at. */
export const debug = { level: 0 };

export const createLivingGrid = (o: LivingGridOptions = {}): Effect => {
  const spacing = o.spacing ?? LATTICE.spacing;
  const size = o.size ?? LATTICE.size;
  const maxAlpha = o.maxAlpha ?? 0.45;
  const maxAlphaLight = o.maxAlphaLight ?? 0.5; // navy on the bright picture: half, or it is a hard speckle
  const minSpeed = o.minSpeed ?? 0.3;
  const maxSpeed = o.maxSpeed ?? 1.0;
  const musicGain = o.musicGain ?? 0.3;
  const pulse = o.pulse ?? 0.4;
  const glow = o.glow ?? 0.35;
  const sparkle = o.sparkle ?? 0.004;

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

  const draw = ({ ctx, time, dark, audio }: Frame) => {
    const { level, lowHit, highHit } = audio;
    debug.level = level;
    // silence: no grain at all; playing, the level is the track's own loudness
    // between its measured floor and peak (spectrum.ts), over a floor of musicGain
    const presence = level < 0.01 ? 0 : Math.min(1, musicGain + (1 - musicGain) * level);
    if (presence <= 0) return;
    // a low hit lifts the whole grain and swells every dot for a moment
    const strength =
      (maxAlphaLight + (maxAlpha - maxAlphaLight) * dark) * presence * (1 + 0.3 * lowHit);
    const dot = size * (1 + pulse * lowHit);
    // cream dots at night, navy by day that warms to the sun's red-orange the
    // louder the music; a low hit glows red in both modes. Accent #c9461f by
    // day, #ef6a3c at night; the mix follows the mode crossfade.
    const warm = Math.min(1, Math.pow(level, 1.3) * (1 - dark) + glow * lowHit);
    const mix = (day: number, night: number, hotDay: number, hotNight: number) => {
      const ink = day * (1 - dark) + night * dark;
      const hot = hotDay * (1 - dark) + hotNight * dark;
      return Math.round(ink + (hot - ink) * warm);
    };
    const r = mix(46, 239, 201, 239);
    const g = mix(59, 230, 70, 106);
    const b = mix(72, 214, 31, 60);
    const half = dot / 2;
    // a high hit: a scatter of cells lit for this frame, a new scatter each
    // frame while the hit lasts, so it crackles
    const tick = Math.floor(time * 25);
    const scatter = highHit > 0.05 ? sparkle * highHit : 0;
    const sr = Math.round(239 * dark + 46 * (1 - dark));
    const sg = Math.round(230 * dark + 59 * (1 - dark));
    const sb = Math.round(214 * dark + 72 * (1 - dark));
    for (let y = 0; y < rows; y++) {
      // slow drifting patches: one sine in each axis, offset in time
      const py = Math.sin(y * 0.3 - time * 0.11);
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (scatter && hash2(x + tick * 7, y + tick * 3) < scatter) {
          ctx.fillStyle = `rgba(${sr},${sg},${sb},${(0.6 * highHit).toFixed(3)})`;
          ctx.fillRect(x * spacing - size, y * spacing - size, size * 2, size * 2);
          continue;
        }
        const s = Math.sin(time * speed[i]! + phase[i]!);
        if (s <= 0.6) continue;
        const patch = 0.5 + 0.5 * Math.sin(x * 0.35 + time * 0.15) * py;
        const alpha = Math.pow(s, 6) * patch * patch * strength;
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillRect(x * spacing - half, y * spacing - half, dot, dot);
      }
    }
  };

  return { resize, draw };
};
