import type { Effect, Frame } from "./types";
import { LATTICE, hash2 } from "./types";
import { sampleHighOnset, sampleLevel } from "./spectrum";

/**
 * The one dot lattice behind the page, with three things going on in it.
 *
 * Ambient: every cell blinks on its own slow sine, and drifting patches make
 * neighbours wake together, so the activity wanders across the screen like
 * film grain snapped to a grid. The same in both modes; only the colour
 * follows the mode crossfade, the day side a little stronger over the veil.
 *
 * Music: the grain is the music's. In silence the grid is dark; the loudness
 * brings it up, so it breathes with the track, and a transient in the
 * treble makes the lit dots flicker for a moment, each a little brighter
 * or dimmer frame by frame. Silence leaves the ambient alone.
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
  musicGain?: number; // loudness at which the grain is at full strength (lower = sooner)
  generationsPerSecond?: number;
  lifespan?: number; // generations a cell lives at most
  seedRadius?: number;
  seedDensity?: number;
  lifeAlpha?: number; // a live cell's brightness
  flickerThreshold?: number; // treble onset (0..1) that sets the dots flickering
  flickerDecay?: number; // seconds for a flicker to die down
};

/** Dev readings: what the music is doing and how many bolts have struck. */
export const debug = {
  level: 0,
  onset: 0,
  get struck() {
    return struck;
  },
};
let struck = 0;

export const createLivingGrid = (o: LivingGridOptions = {}): Effect => {
  const spacing = o.spacing ?? LATTICE.spacing;
  const size = o.size ?? LATTICE.size;
  const maxAlpha = o.maxAlpha ?? 0.45;
  const maxAlphaLight = o.maxAlphaLight ?? 0.75;
  const minSpeed = o.minSpeed ?? 0.3;
  const maxSpeed = o.maxSpeed ?? 1.0;
  const musicGain = o.musicGain ?? 0.55;
  const stepSeconds = 1 / (o.generationsPerSecond ?? 7);
  const lifespan = o.lifespan ?? 240; // ~35s at 7 generations a second
  const seedRadius = o.seedRadius ?? 3;
  const seedDensity = o.seedDensity ?? 0.45;
  const lifeAlpha = o.lifeAlpha ?? 0.95;
  const flickerThreshold = o.flickerThreshold ?? 0.3;
  const flickerDecay = o.flickerDecay ?? 0.3;
  let flicker = 0; // how hard the lit dots flicker right now, 0..1
  let tick = 0; // frame counter, salts the per-dot flicker

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
        if (v <= 0 && e > 0) dying[i] = 1; // just died: start its fade
        next[i] = v > 0 ? v : 0;
        if (v > 0) alive++;
      }
    }
    [energy, next] = [next, energy];
  };

  const draw = ({ ctx, time, dt, pointer, dark }: Frame) => {
    for (const c of pointer.clicks) seed(c.x, c.y);
    level = sampleLevel();
    const onset = sampleHighOnset();

    // the ambient sine of every cell, kept for the life rule as well
    for (let i = 0; i < blink.length; i++) blink[i] = Math.sin(time * speed[i]! + phase[i]!);

    // a treble hit sets the flicker going; it dies down on its own
    if (onset > flickerThreshold && onset > flicker) {
      flicker = onset;
      struck++;
    }
    flicker *= Math.exp(-dt / flickerDecay);
    tick++;
    debug.level = level;
    debug.onset = onset;

    let fading = false;
    const fadeK = Math.exp(-dt / 0.35);
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

    // silence: no grain at all; the music brings it up to full by musicGain
    const presence = Math.min(1, level / musicGain);
    const strength = (maxAlphaLight + (maxAlpha - maxAlphaLight) * dark) * presence;
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
        const s = blink[i]!;
        const e = energy[i]!;
        let alpha = 0;
        if (s > 0.6) {
          const patch = 0.5 + 0.5 * Math.sin(x * 0.35 + time * 0.15) * py;
          alpha = Math.pow(s, 6) * patch * patch * strength;
          // the flicker: each lit dot jumps up or down by its own random
          // amount, a new amount every frame, as hard as the hit was
          if (flicker > 0.02) alpha *= 1 + flicker * (hash2(x + tick * 7, y + tick * 3) * 2.4 - 1);
        }
        if (e > 0) {
          // alive: the grid's dot held bright, still breathing with its blink
          const breath = 0.7 + 0.3 * Math.max(0, s);
          alpha = Math.max(alpha, (0.4 + 0.6 * e) * lifeAlpha * breath);
        } else if (dying[i]! > 0.02) {
          alpha = Math.max(alpha, dying[i]! * 0.6 * lifeAlpha);
        }
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillRect(x * spacing - half, y * spacing - half, size, size);
      }
    }
  };

  return { resize, draw };
};
