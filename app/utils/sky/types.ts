/**
 * Shared shapes for the sky effects. Every effect is a plain object with a
 * `draw` and an optional `resize`, no Vue inside, so it can be run and
 * tested on its own.
 */
export type Frame = {
  ctx: CanvasRenderingContext2D;
  width: number; // CSS pixels; the context is already scaled for the device
  height: number;
  time: number; // seconds since the loop started
  dt: number; // seconds since the last drawn frame
  dark: number; // 0 in light mode, 1 in dark, in between during the crossfade
  level: number; // the music's presence, 0..1; 0 in silence (sampled once per frame)
};

export type Effect = {
  resize?: (width: number, height: number) => void;
  draw: (frame: Frame) => void;
};

/** The one lattice every effect draws on. */
export const LATTICE = { spacing: 12, size: 1.4 } as const;

/** Deterministic 0..1 value for an integer cell, cheap enough per frame. */
export const hash2 = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
