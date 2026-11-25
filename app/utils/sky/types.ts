/**
 * Shared shapes for the sky effects. Every effect is a plain object with a
 * `draw` and an optional `resize`, no Vue inside, so it can be run and
 * tested on its own.
 */
export type Pointer = {
  x: number; // CSS pixels from the left edge
  y: number; // CSS pixels from the top edge
  active: boolean; // false until the first move and after the pointer leaves
};

export type Frame = {
  ctx: CanvasRenderingContext2D;
  width: number; // CSS pixels; the context is already scaled for the device
  height: number;
  time: number; // seconds since the loop started
  dt: number; // seconds since the last drawn frame
  pointer: Pointer;
  dark: number; // 0 in light mode, 1 in dark, in between during the crossfade
};

export type Effect = {
  resize?: (width: number, height: number) => void;
  draw: (frame: Frame) => void;
};

/** Deterministic 0..1 value for an integer cell, cheap enough per frame. */
export const hash2 = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
