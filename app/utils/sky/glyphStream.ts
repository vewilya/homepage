import type { Effect, Frame } from "./types";
import { LATTICE, hash2 } from "./types";

/**
 * The transmission: tapes of type climbing the decoration's rising arc, from
 * the bezel's readouts in the lower left corner up towards the ring.
 *
 * A few lanes run side by side along the arc, each a loop of the tagline
 * with long gaps, sliding upwards at its own pace. Every character sits on
 * a cell of the one lattice, so the motion steps from dot to dot the way
 * the grain does. Most of the time the tape is noise, digits and marks from
 * the instrument alphabet flickering in place; a window drifting along each
 * lane resolves the noise into the words for a moment and lets them go
 * again. The music drives it: the louder the track, the faster the tapes
 * climb and flicker, the wider the window that resolves into words, the
 * brighter the type, and the resolved words warm towards the accent.
 *
 * Same geometry as SkyDecor's arc B, mapped the way the SVG's slice scaling
 * maps it, so the type rides the drawn line.
 */
export type GlyphStreamOptions = {
  phrase?: string;
  lanes?: number; // lanes either side of the arc; the count is 2 * lanes + 1
  gap?: number; // blank cells between two readings of the phrase
  dropout?: number; // share of cells that stay blank for good, 0..1
  minSeconds?: number; // one trip from the bottom to the top, slowest lane
  maxSeconds?: number;
  alphaDark?: number; // a resolved letter's brightness at night
  alphaLight?: number; // and by day, navy over the bright picture
  fontSize?: number;
};

// the decoration's arc B, in its 1600 x 1000 viewBox
const ARC = [
  [-80, 960],
  [260, 520],
  [760, 460],
  [1720, 120],
] as const;
const VIEW = [1600, 1000] as const;
// the noise alphabet: the instrument's digits and marks, ASCII, maths and
// Greek, box drawing and geometry, and music. Code points, not UTF-16 units,
// since the clefs sit outside the basic plane; glyphs the mono font lacks
// come from the system's symbol font.
const NOISE = Array.from(
  "0123456789+-/.:NEM" +
    "!?#%&*@~^<>=[]{}|\\;,_$" +
    "αβγδλμπστφψωΔΣΩ∂∞≈≠±×÷√∫∑∏∮∇⊕⊗⟨⟩" +
    "░▒▓│┃┼╳─═╱╲◇◆○●◐◑□■△▽▲▼◢◣⌐¬¦§¶†‡" +
    "♩♪♫♬♭♮♯𝄞𝄢𝄡𝄽𝄾𝅗𝅥𝅘𝅥𝅘𝅥𝅮𝄆𝄇",
);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const createGlyphStream = (o: GlyphStreamOptions = {}): Effect => {
  const phrase = o.phrase ?? "into sound and space";
  const half = o.lanes ?? 2;
  const gap = o.gap ?? 26;
  const dropout = o.dropout ?? 0.3;
  const minSeconds = o.minSeconds ?? 80;
  const maxSeconds = o.maxSeconds ?? 130;
  const alphaDark = o.alphaDark ?? 0.42;
  const alphaLight = o.alphaLight ?? 0.62;
  const fontSize = o.fontSize ?? 10;
  const spacing = LATTICE.spacing;
  const tape = phrase + " ".repeat(gap);

  // the arc in CSS pixels, sampled once per resize: a table of points along
  // it at even arc length, with the unit normal at each, so a cell's place
  // is a lookup and not a curve evaluation
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let nx = new Float32Array(0);
  let ny = new Float32Array(0);
  let slots = 0; // cells along the arc, one per lattice spacing
  let font = "";
  // how far each lane's tape has climbed, in cells; the music sets the pace
  const travelled = new Float64Array(2 * half + 1);

  const bezier = (t: number): [number, number] => {
    const u = 1 - t;
    const [p0, p1, p2, p3] = ARC;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  };

  const resize = (width: number, height: number) => {
    // xMidYMid slice: the viewBox scaled to cover the window and centred
    const scale = Math.max(width / VIEW[0], height / VIEW[1]);
    const ox = (width - VIEW[0] * scale) / 2;
    const oy = (height - VIEW[1] * scale) / 2;
    // walk the curve finely and keep a point every `spacing` of arc length
    const fine = 2000;
    const xs: number[] = [];
    const ys: number[] = [];
    let [lx, ly] = bezier(0);
    lx = ox + lx * scale;
    ly = oy + ly * scale;
    let carried = 0;
    xs.push(lx);
    ys.push(ly);
    for (let i = 1; i <= fine; i++) {
      let [x, y] = bezier(i / fine);
      x = ox + x * scale;
      y = oy + y * scale;
      carried += Math.hypot(x - lx, y - ly);
      while (carried >= spacing) {
        carried -= spacing;
        xs.push(x);
        ys.push(y);
      }
      lx = x;
      ly = y;
    }
    slots = xs.length;
    px = Float32Array.from(xs);
    py = Float32Array.from(ys);
    nx = new Float32Array(slots);
    ny = new Float32Array(slots);
    for (let i = 0; i < slots; i++) {
      const a = Math.max(0, i - 1);
      const b = Math.min(slots - 1, i + 1);
      const dx = px[b]! - px[a]!;
      const dy = py[b]! - py[a]!;
      const len = Math.hypot(dx, dy) || 1;
      nx[i] = -dy / len;
      ny[i] = dx / len;
    }
    font = `${fontSize}px "JetBrains Mono", ui-monospace, Menlo, monospace`;
  };

  const draw = ({ ctx, time, dt, dark, level }: Frame) => {
    if (!slots) return;
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // navy by day, cream at night, the mix following the mode crossfade;
    // resolved words warm towards the accent (#c9461f day, #ef6a3c night),
    // a gradient from the window's centre outwards, further and further
    // along the arc as the music gets loud
    const ink = [
      22 * (1 - dark) + 239 * dark,
      41 * (1 - dark) + 230 * dark,
      59 * (1 - dark) + 214 * dark,
    ];
    const hot = [
      201 * (1 - dark) + 239 * dark,
      70 * (1 - dark) + 106 * dark,
      31 * (1 - dark) + 60 * dark,
    ];
    const warm = 0.45 + 0.55 * level; // a resolved word's warmth at the window's centre
    const base = (alphaLight + (alphaDark - alphaLight) * dark) * (0.85 + 0.7 * level);
    const cell = spacing / 2;
    // the pace: a slow climb in silence, up to two and a half times that at full level
    const pace = 1 + 1.5 * level;
    // the window of resolution widens with the level: a swell brings words out
    const halfWindow = 0.035 + 0.09 * level;

    for (let lane = -half; lane <= half; lane++) {
      const li = lane + half;
      // each lane: its own pace, phase and a drifting window of resolution
      const seconds = minSeconds + hash2(li, 7) * (maxSeconds - minSeconds);
      travelled[li]! += (dt / seconds) * slots * pace;
      const shift = travelled[li]! + hash2(li, 11) * slots; // cells travelled
      const window = ((time / (seconds * 0.55) + hash2(li, 13)) % 1.3) * 1.1 - 0.05;
      for (let s = 0; s < slots; s++) {
        const t = s / (slots - 1);
        // the tape slides upwards: the cell at s shows the tape's character
        // that has travelled this far
        const k = Math.floor(s - shift);
        const idx = ((k % tape.length) + tape.length) % tape.length;
        const home = tape[idx]!;
        if (home === " ") continue;
        if (hash2(k, li * 31 + 5) < dropout) continue;

        const x = Math.round((px[s]! + nx[s]! * lane * spacing) / spacing) * spacing;
        const y = Math.round((py[s]! + ny[s]! * lane * spacing) / spacing) * spacing;
        if (x < -cell || y < -cell || x > ctx.canvas.clientWidth + cell) continue;

        const env = smooth(0, 0.08, t) * (1 - smooth(0.9, 1, t));
        if (env <= 0) continue;
        const resolve = 1 - smooth(halfWindow, halfWindow * 2, Math.abs(t - window));
        // noise flickers on its own clock per cell, faster as it resolves and
        // faster with the music
        const period = ((0.5 + hash2(k, li) * 1.6) * (1 - 0.7 * resolve)) / pace;
        const tick = Math.floor(time / period);
        const ch =
          resolve > 0.5
            ? home
            : NOISE[(Math.floor(hash2(k, li + 17) * 1000) + tick) % NOISE.length]!;
        const blink =
          0.78 + 0.22 * Math.sin(time * (0.4 + hash2(k, li + 23)) + hash2(k, li + 29) * 7);
        const alpha = env * base * (0.5 + 0.5 * resolve) * blink;
        if (alpha < 0.02) continue;
        const w = Math.min(1, warm * resolve + 0.35 * t * level);
        const r = Math.round(ink[0]! + (hot[0]! - ink[0]!) * w);
        const g = Math.round(ink[1]! + (hot[1]! - ink[1]!) * w);
        const b = Math.round(ink[2]! + (hot[2]! - ink[2]!) * w);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillText(ch, x, y + 0.5);
      }
    }
  };

  return { resize, draw };
};
