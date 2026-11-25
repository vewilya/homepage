import type { Effect, Frame } from "./types";
import { LATTICE, hash2 } from "./types";
import { sampleLevel } from "./spectrum";

/**
 * The one dot lattice behind the page, with three things going on in it.
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
 *
 * Life: a click or a drag drops a colony of Conway's Game of Life onto the
 * same cells. Live cells are the grid's own dots held bright, still
 * breathing with their ambient blink; a colony can also be born where two
 * live neighbours meet a cell the ambient has just lit, so it spreads along
 * the grid's own patches rather than in a vacuum. Energy drains every
 * generation, so nothing stays forever.
 */
export type LivingGridOptions = {
  spacing?: number;
  size?: number;
  maxAlpha?: number; // brightest an ambient dot gets at night
  maxAlphaLight?: number; // and by day, over the cream veil
  minSpeed?: number; // rad/s: a cell blinks once per (2π / speed) seconds
  maxSpeed?: number;
  musicGain?: number; // the grain's floor while music plays, 0..1; it rises to 1 with the level
  generationsPerSecond?: number;
  lifespan?: number; // generations a cell lives at most
  seedRadius?: number;
  seedDensity?: number;
  lifeAlpha?: number; // a live cell's brightness
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
  const stepSeconds = 1 / (o.generationsPerSecond ?? 7);
  const lifespan = o.lifespan ?? 240; // ~35s at 7 generations a second
  const seedRadius = o.seedRadius ?? 3;
  const seedDensity = o.seedDensity ?? 0.45;
  const lifeAlpha = o.lifeAlpha ?? 0.95;

  let cols = 0;
  let rows = 0;
  let phase = new Float32Array(0);
  let speed = new Float32Array(0);
  let blink = new Float32Array(0); // this frame's ambient sine per cell
  let energy = new Float32Array(0); // > 0 means alive; drains by 1/lifespan per generation
  let next = new Float32Array(0);
  let dying = new Float32Array(0); // fade-out of cells that just died
  let accumulator = 0;
  let alive = 0;
  let level = 0;

  const resize = (width: number, height: number) => {
    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;
    const n = cols * rows;
    phase = new Float32Array(n);
    speed = new Float32Array(n);
    blink = new Float32Array(n);
    energy = new Float32Array(n);
    next = new Float32Array(n);
    dying = new Float32Array(n);
    alive = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        phase[i] = hash2(x, y) * Math.PI * 2;
        speed[i] = minSpeed + hash2(x + 1000, y) * (maxSpeed - minSpeed);
      }
    }
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
        } else if (n === 2 && blink[i]! > 0.995) {
          // the grid's own sparkle stands in for the third parent: the colony
          // creeps along whatever the ambient is lighting up right now
          v = (sum / 2) * 0.7 - drain;
        }
        if (v <= 0 && e > 0) dying[i] = 0.15 + 0.85 * e; // just died: fade from where it was
        next[i] = v > 0 ? v : 0;
        if (v > 0) alive++;
      }
    }
    [energy, next] = [next, energy];
  };

  const draw = ({ ctx, time, dt, pointer, dark }: Frame) => {
    for (const c of pointer.clicks) seed(c.x, c.y);
    level = sampleLevel();

    // the ambient sine of every cell, kept for the life rule as well
    for (let i = 0; i < blink.length; i++) blink[i] = Math.sin(time * speed[i]! + phase[i]!);

    debug.level = level;

    let fading = false;
    const fadeK = Math.exp(-dt / 0.9); // a death is a slow dimming, not a blink-out
    for (let i = 0; i < dying.length; i++) {
      if (dying[i]! > 0.02) {
        dying[i]! *= fadeK;
        fading = true;
      } else dying[i] = 0;
    }
    if (alive || fading) {
      accumulator += dt;
      while (accumulator >= stepSeconds) {
        accumulator -= stepSeconds;
        generation();
      }
    } else accumulator = 0;

    // silence: no grain at all; playing, the level is the track's own loudness
    // between its measured floor and peak (spectrum.ts), over a floor of musicGain
    const presence = level < 0.01 ? 0 : Math.min(1, musicGain + (1 - musicGain) * level);
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
        const s = blink[i]!;
        const e = energy[i]!;
        let alpha = 0;
        if (s > 0.6) {
          const patch = 0.5 + 0.5 * Math.sin(x * 0.35 + time * 0.15) * py;
          alpha = Math.pow(s, 6) * patch * patch * strength;
        }
        if (e > 0) {
          // alive: the grid's dot held bright, still breathing with its blink
          // brightness follows the cell's energy all the way down, so a colony
          // dims as it ages and its death is only the last step of that
          const breath = 0.7 + 0.3 * Math.max(0, s);
          alpha = Math.max(alpha, (0.15 + 0.85 * e) * lifeAlpha * breath);
        } else if (dying[i]! > 0.02) {
          alpha = Math.max(alpha, dying[i]! * lifeAlpha);
        }
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillRect(x * spacing - half, y * spacing - half, size, size);
      }
    }
  };

  return { resize, draw };
};
