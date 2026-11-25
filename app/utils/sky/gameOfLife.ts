import type { Effect, Frame } from "./types";
import { LATTICE } from "./types";

/**
 * Conway's Game of Life on the dot lattice, seeded by clicks.
 *
 * A click drops a small random colony around the pointer. The usual rules
 * run at a few generations a second: a live cell with two or three live
 * neighbours lives on, a dead cell with exactly three is born, everything
 * else dies. Each cell also carries energy: it runs down a little every
 * generation, and a newborn cell inherits the average of its three parents'
 * energy, so the colony as a whole dims generation by generation. Gliders
 * and oscillators get a good run, but nothing stays on the page forever.
 *
 * Live cells are drawn as the grid's dots at full strength; a cell that just
 * died fades out over a fraction of a second, which keeps the motion soft at
 * the low generation rate.
 */
export type GameOfLifeOptions = {
  spacing?: number; // the grid's lattice
  size?: number; // dot edge in CSS px
  generationsPerSecond?: number;
  lifespan?: number; // generations a cell lives at most
  seedRadius?: number; // cells around the click that may be seeded
  seedDensity?: number; // chance a seed cell starts alive
  maxAlpha?: number;
};

export const createGameOfLife = (options: GameOfLifeOptions = {}): Effect => {
  const spacing = options.spacing ?? LATTICE.spacing;
  const size = options.size ?? LATTICE.size;
  const stepSeconds = 1 / (options.generationsPerSecond ?? 7);
  const lifespan = options.lifespan ?? 240; // ~35s at 7 generations a second
  const seedRadius = options.seedRadius ?? 3;
  const seedDensity = options.seedDensity ?? 0.45;
  const maxAlpha = options.maxAlpha ?? 0.95;

  let cols = 0;
  let rows = 0;
  let energy = new Float32Array(0); // > 0 means alive; drains by 1/lifespan per generation
  let next = new Float32Array(0);
  let dying = new Float32Array(0); // fade-out of cells that just died
  let accumulator = 0;
  let alive = 0;

  const resize = (w: number, h: number) => {
    cols = Math.ceil(w / spacing) + 1;
    rows = Math.ceil(h / spacing) + 1;
    energy = new Float32Array(cols * rows);
    next = new Float32Array(cols * rows);
    dying = new Float32Array(cols * rows);
    alive = 0;
  };

  const seed = (px: number, py: number) => {
    const cx = Math.round(px / spacing);
    const cy = Math.round(py / spacing);
    for (let y = cy - seedRadius; y <= cy + seedRadius; y++) {
      if (y < 0 || y >= rows) continue;
      for (let x = cx - seedRadius; x <= cx + seedRadius; x++) {
        if (x < 0 || x >= cols) continue;
        if (Math.random() < seedDensity) {
          energy[y * cols + x] = 1;
          alive++;
        }
      }
    }
  };

  const generation = () => {
    const drain = 1 / lifespan;
    alive = 0;
    for (let y = 0; y < rows; y++) {
      const up = y > 0 ? (y - 1) * cols : -1;
      const mid = y * cols;
      const down = y < rows - 1 ? (y + 1) * cols : -1;
      for (let x = 0; x < cols; x++) {
        // count live neighbours and sum their energy in one pass
        let n = 0;
        let sum = 0;
        const l = x > 0;
        const r = x < cols - 1;
        const tally = (j: number) => {
          const v = energy[j]!;
          if (v > 0) {
            n++;
            sum += v;
          }
        };
        if (up >= 0) {
          if (l) tally(up + x - 1);
          tally(up + x);
          if (r) tally(up + x + 1);
        }
        if (l) tally(mid + x - 1);
        if (r) tally(mid + x + 1);
        if (down >= 0) {
          if (l) tally(down + x - 1);
          tally(down + x);
          if (r) tally(down + x + 1);
        }
        const i = mid + x;
        const e = energy[i]!;
        let v = 0;
        if (e > 0) {
          if (n === 2 || n === 3) v = e - drain; // survives, a little older
        } else if (n === 3) {
          v = (sum / 3) * 0.97 - drain; // born, with its parents' energy
        }
        if (v <= 0 && e > 0) dying[i] = 1; // just died: start its fade
        next[i] = v > 0 ? v : 0;
        if (v > 0) alive++;
      }
    }
    [energy, next] = [next, energy];
  };

  const draw = ({ ctx, dt, pointer, dark }: Frame) => {
    for (const c of pointer.clicks) seed(c.x, c.y);
    let fading = false;
    const fadeK = Math.exp(-dt / 0.35);
    for (let i = 0; i < dying.length; i++) {
      if (dying[i]! > 0.02) {
        dying[i]! *= fadeK;
        fading = true;
      } else dying[i] = 0;
    }
    if (!alive && !fading) return;

    accumulator += dt;
    while (accumulator >= stepSeconds) {
      accumulator -= stepSeconds;
      generation();
    }

    const r = Math.round(29 + (239 - 29) * dark);
    const g = Math.round(52 + (230 - 52) * dark);
    const b = Math.round(73 + (214 - 73) * dark);
    const half = size / 2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const e = energy[i]!;
        const a = e > 0 ? (0.4 + 0.6 * e) * maxAlpha : dying[i]! * 0.6 * maxAlpha;
        if (a < 0.02) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.fillRect(x * spacing - half, y * spacing - half, size, size);
      }
    }
  };

  return { resize, draw };
};
