import type { Effect, Frame } from "./types";

/**
 * Butterflies for light mode: a small flock drifting across the page on
 * wandering headings, each beating its wings at its own rate. Every so often
 * one flutters, a quick turn with a burst of speed, so the motion stays a
 * little erratic. They shy away from the pointer.
 *
 * A butterfly is two wing shapes mirrored about a short body, drawn in the
 * heading's direction. The wing beat is a scale across the body axis, so
 * from the side the wings close to a line and open again.
 */
export type ButterflyOptions = {
  perArea?: number; // butterflies per million CSS pixels²
  minCount?: number;
  maxCount?: number;
  alpha?: number; // how visible, 0..1
};

type Butterfly = {
  x: number;
  y: number;
  heading: number; // radians, 0 = right
  speed: number; // px/s cruising
  burst: number; // extra px/s, decays
  size: number; // wing length in px
  phase: number; // wing beat
  rate: number; // wing beats per second
  wander: number; // per-butterfly noise offset
  nextFlutter: number; // time of the next quick turn
  color: readonly [number, number, number];
};

const PALETTE = [
  [226, 82, 42], // orange, the sun
  [29, 52, 73], // navy, the sky
  [196, 142, 78], // sand, the rock
] as const;

export const createButterflies = (options: ButterflyOptions = {}): Effect => {
  const perArea = options.perArea ?? 22;
  const minCount = options.minCount ?? 8;
  const maxCount = options.maxCount ?? 36;
  const alpha = options.alpha ?? 0.8;

  let width = 0;
  let height = 0;
  let flock: Butterfly[] = [];
  let lastTime = 0;

  const spawn = (t: number): Butterfly => ({
    x: Math.random() * width,
    y: Math.random() * height,
    heading: Math.random() * Math.PI * 2,
    speed: 18 + Math.random() * 22,
    burst: 0,
    size: 6.5 + Math.random() * 5,
    phase: Math.random() * Math.PI * 2,
    rate: 5 + Math.random() * 3,
    wander: Math.random() * 1000,
    nextFlutter: t + 1 + Math.random() * 4,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
  });

  const resize = (w: number, h: number) => {
    width = w;
    height = h;
    const target = Math.round(Math.min(maxCount, Math.max(minCount, (w * h * perArea) / 1e6)));
    while (flock.length < target) flock.push(spawn(lastTime));
    flock.length = target;
    for (const b of flock) {
      b.x = Math.min(b.x, w);
      b.y = Math.min(b.y, h);
    }
  };

  const step = (b: Butterfly, t: number, dt: number, frame: Frame) => {
    // slow wandering of the heading, a different rhythm per butterfly
    b.heading += (Math.sin(t * 0.7 + b.wander) * 0.8 + Math.sin(t * 1.9 + b.wander * 2) * 0.4) * dt;
    // the flutter: a sharp turn and a burst of speed
    if (t >= b.nextFlutter) {
      b.heading += (Math.random() - 0.5) * Math.PI * 1.2;
      b.burst = 40 + Math.random() * 50;
      b.nextFlutter = t + 1.5 + Math.random() * 5;
    }
    b.burst *= Math.exp(-dt * 2.5);
    // keep clear of the pointer
    const p = frame.pointer;
    if (p.active) {
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 140 * 140 && d2 > 1) {
        const away = Math.atan2(dy, dx);
        let diff = away - b.heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // shortest turn
        b.heading += diff * Math.min(1, dt * 4);
        b.burst = Math.max(b.burst, 30);
      }
    }
    const v = b.speed + b.burst;
    b.x += Math.cos(b.heading) * v * dt;
    // a little lift on every down-beat
    b.y += Math.sin(b.heading) * v * dt - Math.cos(b.phase) * 6 * dt;
    b.phase += b.rate * Math.PI * 2 * dt;
    // wrap around with a margin so nothing pops at the edge
    const m = 20;
    if (b.x < -m) b.x = width + m;
    if (b.x > width + m) b.x = -m;
    if (b.y < -m) b.y = height + m;
    if (b.y > height + m) b.y = -m;
  };

  const drawOne = (ctx: CanvasRenderingContext2D, b: Butterfly, a: number) => {
    const open = 0.25 + 0.75 * Math.abs(Math.cos(b.phase)); // 1 = wings flat
    const s = b.size;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.heading + Math.PI / 2); // body points along the heading
    ctx.scale(open, 1);
    ctx.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${a.toFixed(3)})`;
    // two wings, each a fore and a hind lobe, mirrored about the body
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.15);
      ctx.bezierCurveTo(
        side * s * 0.9,
        -s * 1.1,
        side * s * 1.3,
        -s * 0.1,
        side * s * 0.35,
        s * 0.05,
      );
      ctx.bezierCurveTo(side * s * 1.0, s * 0.35, side * s * 0.55, s * 0.95, 0, s * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // the body, drawn unscaled so it stays a thin line
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.heading + Math.PI / 2);
    ctx.strokeStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${(a * 0.9).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.35);
    ctx.lineTo(0, s * 0.5);
    ctx.stroke();
    ctx.restore();
  };

  const draw = (frame: Frame) => {
    const { ctx, time, dt, dark } = frame;
    lastTime = time;
    const visible = (1 - dark) * alpha;
    if (visible < 0.01) return; // dark mode: nothing to see, nothing to do
    for (const b of flock) {
      step(b, time, Math.min(dt, 0.1), frame);
      drawOne(ctx, b, visible);
    }
  };

  return { resize, draw };
};
