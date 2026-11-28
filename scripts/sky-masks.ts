#!/usr/bin/env vpx
/**
 * Where the sky is in every picture: a small one-bit mask per picture,
 * written to app/utils/sky/skyMasks.ts. The sky's dot grain reads it so
 * the dots stay in the sky and off the mountains.
 *
 * A mask drawn by hand wins: images/masks/<name>.png, the picture's
 * proportions at any size, light where the sky is and dark where it is
 * not (alpha counts as coverage too). Without one, the mask is found
 * automatically, as a horizon per column:
 *
 * Reads the masters in images/ (PNG, same cut as the served WebPs), block
 * averages them to a couple of hundred columns (which also blurs away the
 * stars), then walks each column from the top while the colour still reads
 * as sky: by day blue, or the sun's orange; at night anything dark enough,
 * planets included. Snow, suits, rock and haze end the walk; two rows of
 * them in a row mark the horizon. A moon, a rocket, a planet's rim or an
 * orbit line would end it too, so a line a few columns thin is skipped
 * outright, and a short run of not-sky is skipped as an island when the
 * sky goes on below it in the same colour as the open sky beside it in
 * that row; a snow cap over a shaded slope fails that test, since the
 * slope is a different blue from the sky next to it. A median across
 * columns takes out the last spikes.
 *
 * Previews go to --preview <dir>: the picture dimmed where it is not sky,
 * for checking by eye. --export <dir> writes each mask as a black and
 * white PNG at the master's own size, a starting point to paint over and
 * save into images/masks/. No dependencies: the PNGs are decoded here.
 *
 * The masks are stored at MASK_BLOCK pixels of the picture per cell, one
 * bit per cell, base64; the sky samples them bilinearly, so the edge is
 * soft by a cell either way.
 *
 *   vpx scripts/sky-masks.ts --preview /tmp/horizons
 *   vpx scripts/sky-masks.ts --export images/masks-auto
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const ROOT = new URL("..", import.meta.url).pathname;
const MASTERS: { name: string; mode: "light" | "dark"; file: string }[] = [
  {
    name: "moonlit-astronaut",
    mode: "light",
    file: "images/light/Moonlit Astronaut Over Alpine Peaks.png",
  },
  {
    name: "retro-rocket",
    mode: "light",
    file: "images/light/Retro Rocket Over Alpine Peaks-1-2.png",
  },
  {
    name: "starlit-planets",
    mode: "light",
    file: "images/light/Swiss Alps Beneath Starlit Planets-3.png",
  },
  { name: "twin-moons", mode: "dark", file: "images/dark/Astronaut Beneath Twin Moons-2.png" },
  {
    name: "rocket-snowy-peaks",
    mode: "dark",
    file: "images/dark/Retro Rocket Over Snowy Peaks-1.png",
  },
  {
    name: "galactic-mountains",
    mode: "dark",
    file: "images/dark/Midnight Galactic Mountain Landscape-3.png",
  },
];
const BLOCK = 8; // pixels per cell of the downsample the horizon is found on
const MASK_BLOCK = 12; // pixels of the picture per mask cell
const STOP_ROWS = 2; // consecutive non-sky rows that end the sky
const ISLAND_ROWS = 0.2; // a not-sky run up to this share of the height may be an island
const RESUME_ROWS = 3; // sky rows needed below it
const BESIDE = 16; // columns to either side where the open sky is compared
const SAME_SKY = 36; // RGB distance (0..255) between an island's underside and the sky beside
const THIN = 3; // a not-sky line this many columns wide or less is skipped
const MEDIAN = 9; // columns
const PREVIEW_SCALE = 4;

// ---------------------------------------------------------------- PNG in
type Raster = { width: number; height: number; rgb: Uint8Array };

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf: Uint8Array) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** The raster plus coverage: alpha where the PNG has it, else opaque. */
type RasterA = Raster & { alpha: Uint8Array };

const readPng = (path: string): RasterA => {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path}: not a PNG`);
  let pos = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("latin1", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const depth = data[8];
      const color = data[9];
      if (depth !== 8 || data[12] !== 0) throw new Error(`${path}: need 8-bit, non-interlaced`);
      channels = color === 2 ? 3 : color === 6 ? 4 : 0;
      if (!channels) throw new Error(`${path}: need RGB or RGBA (colour type ${color})`);
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rgb = new Uint8Array(width * height * 3);
  const alpha = new Uint8Array(width * height).fill(255);
  const prev = new Uint8Array(stride);
  const cur = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const off = y * (stride + 1);
    const filter = raw[off]!;
    for (let i = 0; i < stride; i++) {
      const x = raw[off + 1 + i]!;
      const a = i >= channels ? cur[i - channels]! : 0;
      const b = prev[i]!;
      const c = i >= channels ? prev[i - channels]! : 0;
      let v: number;
      switch (filter) {
        case 0:
          v = x;
          break;
        case 1:
          v = x + a;
          break;
        case 2:
          v = x + b;
          break;
        case 3:
          v = x + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          throw new Error(`${path}: filter ${filter}`);
      }
      cur[i] = v & 0xff;
    }
    for (let x = 0; x < width; x++) {
      rgb[(y * width + x) * 3] = cur[x * channels]!;
      rgb[(y * width + x) * 3 + 1] = cur[x * channels + 1]!;
      rgb[(y * width + x) * 3 + 2] = cur[x * channels + 2]!;
      if (channels === 4) alpha[y * width + x] = cur[x * channels + 3]!;
    }
    prev.set(cur);
  }
  return { width, height, rgb, alpha };
};

// --------------------------------------------------------------- PNG out
const chunk = (type: string, data: Uint8Array) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const writePng = (path: string, r: Raster) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(r.width, 0);
  ihdr.writeUInt32BE(r.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const rows = Buffer.alloc((r.width * 3 + 1) * r.height);
  for (let y = 0; y < r.height; y++) {
    rows[y * (r.width * 3 + 1)] = 0;
    rows.set(r.rgb.subarray(y * r.width * 3, (y + 1) * r.width * 3), y * (r.width * 3 + 1) + 1);
  }
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(rows)),
      chunk("IEND", new Uint8Array(0)),
    ]),
  );
};

// ------------------------------------------------------------- the walk
const downsample = (r: Raster, block: number): Raster => {
  const width = Math.floor(r.width / block);
  const height = Math.floor(r.height / block);
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      for (let dy = 0; dy < block; dy++)
        for (let dx = 0; dx < block; dx++) {
          const i = ((y * block + dy) * r.width + x * block + dx) * 3;
          s0 += r.rgb[i]!;
          s1 += r.rgb[i + 1]!;
          s2 += r.rgb[i + 2]!;
        }
      const n = block * block;
      rgb[(y * width + x) * 3] = s0 / n;
      rgb[(y * width + x) * 3 + 1] = s1 / n;
      rgb[(y * width + x) * 3 + 2] = s2 / n;
    }
  return { width, height, rgb };
};

const hsv = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const d = max - min;
  let h = 0;
  if (d > 0) {
    const R = r / 255;
    const G = g / 255;
    const B = b / 255;
    h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max > 0 ? d / max : 0, v: max };
};

const skyLike = (mode: "light" | "dark", r: number, g: number, b: number) => {
  const { h, s, v } = hsv(r, g, b);
  if (mode === "dark") return v <= 0.38; // the dark navy, the planets, the moon's shadow
  // the blue, from the dark top to the pale horizon, and the grey-blue of a planet
  const blue = h >= 170 && h <= 250 && s >= 0.06 && v >= 0.1 && v <= 0.82;
  const orange = (h <= 35 || h >= 340) && s >= 0.45 && v >= 0.45; // the sun
  return blue || orange;
};

const horizonOf = (small: Raster, mode: "light" | "dark") => {
  const { width, height, rgb } = small;
  const sky = new Uint8Array(width * height);
  for (let i = 0; i < sky.length; i++)
    sky[i] = skyLike(mode, rgb[i * 3]!, rgb[i * 3 + 1]!, rgb[i * 3 + 2]!) ? 1 : 0;
  // a thin line, a rocket's trail or a planet's rim where it runs steeply,
  // is sky: not-sky with sky a few columns to both sides in the same row
  const thinned = new Uint8Array(sky);
  for (let y = 0; y < height; y++)
    for (let x = THIN; x < width - THIN; x++)
      if (!sky[y * width + x] && sky[y * width + x - THIN] && sky[y * width + x + THIN])
        thinned[y * width + x] = 1;
  sky.set(thinned);
  // how deep each column is open sky from the top
  const open = new Int32Array(width);
  for (let x = 0; x < width; x++) {
    let y = 0;
    while (y < height && sky[y * width + x]) y++;
    open[x] = y;
  }
  // the mean colour of `n` rows of one column from `y0` down
  const mean = (x: number, y0: number, n: number) => {
    const c = [0, 0, 0];
    for (let y = y0; y < y0 + n; y++)
      for (let k = 0; k < 3; k++) c[k]! += rgb[(y * width + x) * 3 + k]!;
    return c.map((v) => v / n);
  };
  const distance = (a: number[], b: number[]) =>
    Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
  const maxIsland = Math.round(height * ISLAND_ROWS);

  const out = new Float64Array(width);
  for (let x = 0; x < width; x++) {
    let y = 0;
    let horizon = height;
    while (y < height) {
      // walk the sky
      while (y < height && sky[y * width + x]) y++;
      if (y >= height) break;
      // a not-sky run from y0: an island if sky of the same colour resumes
      const y0 = y;
      let y1 = y0;
      while (y1 < height && !sky[y1 * width + x]) y1++;
      let resumed = 0;
      while (y1 + resumed < height && sky[(y1 + resumed) * width + x]) resumed++;
      // the sky under it has to be the open sky's colour in that row, read
      // from a column to the left or right that is still open sky there
      let beside = false;
      if (y1 - y0 <= maxIsland && resumed >= RESUME_ROWS) {
        const under = mean(x, y1, RESUME_ROWS);
        for (const nx of [x - BESIDE, x + BESIDE]) {
          if (nx < 0 || nx >= width || open[nx]! < y1 + RESUME_ROWS) continue;
          if (distance(under, mean(nx, y1, RESUME_ROWS)) <= SAME_SKY) beside = true;
        }
      }
      const island = beside;
      if (y1 - y0 < STOP_ROWS || island) {
        y = y1; // a speck, or an island: carry on below it
        continue;
      }
      horizon = y0;
      break;
    }
    out[x] = horizon / height;
  }
  // a median across the columns takes out spikes a few columns wide
  const med = new Float64Array(width);
  const half = (MEDIAN - 1) / 2;
  for (let x = 0; x < width; x++) {
    const w: number[] = [];
    for (let k = -half; k <= half; k++) w.push(out[Math.min(width - 1, Math.max(0, x + k))]!);
    w.sort((a, b) => a - b);
    med[x] = w[half]!;
  }
  return med;
};

// ------------------------------------------------------------------ main
const args = process.argv.slice(2);
const previewDir = args.includes("--preview") ? args[args.indexOf("--preview") + 1] : undefined;
if (previewDir) mkdirSync(previewDir, { recursive: true });
const exportDir = args.includes("--export") ? args[args.indexOf("--export") + 1] : undefined;
if (exportDir) mkdirSync(exportDir, { recursive: true });

/** One bit per cell, rows top to bottom, packed MSB first, base64. */
const pack = (bits: Uint8Array) => {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) if (bits[i]) bytes[i >> 3]! |= 0x80 >> (i & 7);
  return Buffer.from(bytes).toString("base64");
};

/** A hand-drawn mask, resampled to the mask grid: a cell is sky if the mean coverage there is at least a half. */
const handMask = (path: string, cols: number, rows: number) => {
  const m = readPng(path);
  const bits = new Uint8Array(cols * rows);
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++) {
      const x0 = Math.floor((cx * m.width) / cols);
      const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * m.width) / cols));
      const y0 = Math.floor((cy * m.height) / rows);
      const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * m.height) / rows));
      let sum = 0;
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const i = y * m.width + x;
          const light = (m.rgb[i * 3]! + m.rgb[i * 3 + 1]! + m.rgb[i * 3 + 2]!) / 765;
          sum += light * (m.alpha[i]! / 255);
        }
      bits[cy * cols + cx] = sum / ((x1 - x0) * (y1 - y0)) >= 0.5 ? 1 : 0;
    }
  return bits;
};

const results: Record<string, string> = {};
let cols = 0;
let rows = 0;
for (const m of MASTERS) {
  const full = readPng(join(ROOT, m.file));
  cols = Math.round(full.width / MASK_BLOCK);
  rows = Math.round(full.height / MASK_BLOCK);
  const small = downsample(full, BLOCK);
  const hand = join(ROOT, "images/masks", `${m.name}.png`);
  let bits: Uint8Array;
  let horizon: Float64Array | undefined;
  if (existsSync(hand)) {
    bits = handMask(hand, cols, rows);
  } else {
    horizon = horizonOf(small, m.mode);
    bits = new Uint8Array(cols * rows);
    for (let cy = 0; cy < rows; cy++)
      for (let cx = 0; cx < cols; cx++) {
        const h =
          horizon[Math.min(small.width - 1, Math.floor(((cx + 0.5) / cols) * small.width))]!;
        bits[cy * cols + cx] = (cy + 0.5) / rows < h ? 1 : 0;
      }
  }
  results[m.name] = pack(bits);
  if (exportDir) {
    // the mask at the master's size: white sky, black everything else
    const e: Raster = {
      width: full.width,
      height: full.height,
      rgb: new Uint8Array(full.width * full.height * 3),
    };
    for (let y = 0; y < e.height; y++) {
      const cy = Math.min(rows - 1, Math.floor((y / e.height) * rows));
      for (let x = 0; x < e.width; x++) {
        const cx = Math.min(cols - 1, Math.floor((x / e.width) * cols));
        if (bits[cy * cols + cx]) e.rgb.fill(255, (y * e.width + x) * 3, (y * e.width + x) * 3 + 3);
      }
    }
    writePng(join(exportDir, `${m.name}.png`), e);
  }
  const sky = bits.reduce((a, v) => a + v, 0) / bits.length;
  console.log(
    `${m.name.padEnd(20)} ${existsSync(hand) ? "hand-drawn" : "automatic "}  sky ${(sky * 100).toFixed(0)}% of the picture`,
  );
  if (previewDir) {
    const p: Raster = { width: small.width, height: small.height, rgb: new Uint8Array(small.rgb) };
    const at = (x: number, y: number) =>
      bits[
        Math.min(rows - 1, Math.floor((y / p.height) * rows)) * cols +
          Math.min(cols - 1, Math.floor((x / p.width) * cols))
      ]!;
    for (let x = 0; x < p.width; x++)
      for (let y = 0; y < p.height; y++) {
        const i = (y * p.width + x) * 3;
        const here = at(x, y);
        const edge = y > 0 && at(x, y - 1) !== here;
        if (edge) {
          p.rgb[i] = 255;
          p.rgb[i + 1] = 40;
          p.rgb[i + 2] = 40;
        } else if (!here) {
          p.rgb[i] = p.rgb[i]! * 0.35;
          p.rgb[i + 1] = p.rgb[i + 1]! * 0.35;
          p.rgb[i + 2] = p.rgb[i + 2]! * 0.35;
        }
      }
    const big: Raster = {
      width: p.width * PREVIEW_SCALE,
      height: p.height * PREVIEW_SCALE,
      rgb: new Uint8Array(p.width * p.height * PREVIEW_SCALE * PREVIEW_SCALE * 3),
    };
    for (let y = 0; y < big.height; y++)
      for (let x = 0; x < big.width; x++) {
        const src = ((y / PREVIEW_SCALE) | 0) * p.width + ((x / PREVIEW_SCALE) | 0);
        big.rgb.set(p.rgb.subarray(src * 3, src * 3 + 3), (y * big.width + x) * 3);
      }
    writePng(join(previewDir, `${m.name}.png`), big);
  }
}

const out = `// Generated by scripts/sky-masks.ts from the masters in images/. Do not edit.
// Where the sky is in every picture: one bit per cell, ${cols} columns by
// ${rows} rows over the picture, rows top to bottom, packed MSB first, base64.
export const MASK_COLS = ${cols};
export const MASK_ROWS = ${rows};
export const MASKS: Record<string, string> = {
${Object.entries(results)
  .map(([k, v]) => `  "${k}":\n    "${v}",`)
  .join("\n")}
};
`;
writeFileSync(join(ROOT, "app/utils/sky/skyMasks.ts"), out);
console.log(`wrote app/utils/sky/skyMasks.ts (${cols}x${rows} cells per picture)`);
