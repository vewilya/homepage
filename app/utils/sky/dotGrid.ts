import type { Effect, Frame } from "./types";
import { LATTICE, hash2 } from "./types";

/**
 * Ambient dot-grid noise: a lattice of tiny dots, almost all dark, where a
 * few blink softly in slowly drifting patches. Film grain snapped to a grid.
 * The same in both modes; only the colour follows the mode crossfade, and
 * the day side is a little stronger to show through the cream veil.
 *
 * Each cell has a fixed random phase and speed (set on resize); the patch
 * term makes neighbouring cells wake up together so the activity wanders
 * across the screen instead of sparkling evenly. Cells far below the
 * visible threshold are skipped before any drawing, which is most of them.
 */
export type DotGridOptions = {
  spacing?: number; // CSS px between dots
  size?: number; // dot edge in CSS px
  maxAlpha?: number; // brightest a dot gets at night
  maxAlphaLight?: number; // and by day, over the cream veil
  minSpeed?: number; // rad/s: a cell blinks once per (2π / speed) seconds
  maxSpeed?: number;
};

export const createDotGrid = (options: DotGridOptions = {}): Effect => {
  const spacing = options.spacing ?? LATTICE.spacing;
  const size = options.size ?? LATTICE.size;
  const maxAlpha = options.maxAlpha ?? 0.45;
  const maxAlphaLight = options.maxAlphaLight ?? 0.75;
  const minSpeed = options.minSpeed ?? 0.3;
  const maxSpeed = options.maxSpeed ?? 1.0;

  let cols = 0;
  let rows = 0;
  let phase = new Float32Array(0);
  let speed = new Float32Array(0);

  const resize = (width: number, height: number) => {
    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;
    phase = new Float32Array(cols * rows);
    speed = new Float32Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        phase[i] = hash2(x, y) * Math.PI * 2;
        speed[i] = minSpeed + hash2(x + 1000, y) * (maxSpeed - minSpeed);
      }
    }
  };

  const draw = ({ ctx, time, dark }: Frame) => {
    const strength = maxAlphaLight + (maxAlpha - maxAlphaLight) * dark;
    // cream dots at night, navy by day; the mix follows the mode crossfade
    const r = Math.round(29 + (239 - 29) * dark);
    const g = Math.round(52 + (230 - 52) * dark);
    const b = Math.round(73 + (214 - 73) * dark);
    const half = size / 2;
    for (let y = 0; y < rows; y++) {
      // slow drifting patches: one sine in each axis, offset in time
      const py = Math.sin(y * 0.3 - time * 0.11);
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const blink = Math.sin(time * speed[i]! + phase[i]!);
        if (blink < 0.6) continue; // the ~80% of cells that are off right now
        const patch = 0.5 + 0.5 * Math.sin(x * 0.35 + time * 0.15) * py;
        const alpha = Math.pow(blink, 6) * patch * patch * strength;
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillRect(x * spacing - half, y * spacing - half, size, size);
      }
    }
  };

  return { resize, draw };
};
