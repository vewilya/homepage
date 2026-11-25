<script setup lang="ts">
/**
 * Full-screen canvas behind the page content and over the pictures. Owns
 * the animation loop, the device-pixel scaling, the pointer position and
 * the mode value, and hands all of that to a list of effects each frame.
 *
 * - Draws at most ~25 frames a second: ambient grain does not need more and
 *   it keeps laptops cool. requestAnimationFrame already pauses in hidden tabs.
 * - `prefers-reduced-motion` keeps the canvas blank, and switching it on
 *   mid-visit stops the loop at the next frame.
 * - The mode value is read from the stylesheet's --layer-dark variable and
 *   eased towards on the same curve and over the same 8s as the pictures'
 *   crossfade, so the dots recolour in step with everything behind them.
 */
import { LATTICE, type Effect, type Frame, type Pointer } from "~/utils/sky/types";
import { createDotGrid } from "~/utils/sky/dotGrid";
import { createGameOfLife } from "~/utils/sky/gameOfLife";

const FRAME_MS = 40; // ~25 fps
const MODE_EASE_MS = 8000; // matches --mode-fade in main.css

/** CSS `ease`, cubic-bezier(0.25, 0.1, 0.25, 1): the curve the pictures fade on. */
const cssEase = (t: number) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // x(u) for the control points (0.25, 0.1) and (0.25, 1); solve x(u) = t by Newton's method
  const bx = (u: number) =>
    3 * (1 - u) * (1 - u) * u * 0.25 + 3 * (1 - u) * u * u * 0.25 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * 0.1 + 3 * (1 - u) * u * u * 1 + u * u * u;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const dx = 0.75 * (1 - u) * (1 - u) + 2.25 * u * u; // dx/du, the middle term cancels
    if (dx < 1e-6) break;
    u -= (bx(u) - t) / dx;
  }
  return by(Math.min(1, Math.max(0, u)));
};

const canvas = ref<HTMLCanvasElement>();

onMounted(() => {
  const el = canvas.value!;
  const ctx = el.getContext("2d", { alpha: true })!;
  // the ambient pulse, and a Game of Life on the same lattice, seeded by clicks
  const effects: Effect[] = [createDotGrid(), createGameOfLife()];
  const pointer: Pointer = { x: 0, y: 0, active: false, clicks: [] };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0;
  let height = 0;
  let raf = 0;
  let startedAt = 0;
  let lastDrawn = 0;
  let dark = 0;
  // the mode fade in flight: from the value at the switch towards the new target
  let fadeFrom = 0;
  let fadeTo = 0;
  let fadeStart = 0;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    el.width = Math.round(width * dpr);
    el.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const e of effects) e.resize?.(width, height);
  };

  const targetDark = () =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--layer-dark")) || 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - lastDrawn < FRAME_MS) return;
    const dt = lastDrawn ? (now - lastDrawn) / 1000 : 0;
    lastDrawn = now;
    // ease the mode value on the pictures' own curve and clock
    const target = targetDark();
    if (target !== fadeTo) {
      fadeFrom = dark;
      fadeTo = target;
      fadeStart = now;
    }
    dark = fadeFrom + (fadeTo - fadeFrom) * cssEase((now - fadeStart) / MODE_EASE_MS);

    ctx.clearRect(0, 0, width, height);
    const f: Frame = { ctx, width, height, time: (now - startedAt) / 1000, dt, pointer, dark };
    const t0 = import.meta.dev ? performance.now() : 0;
    for (const e of effects) e.draw(f);
    pointer.clicks.length = 0; // consumed by this frame
    if (import.meta.dev) stats.drawMs = performance.now() - t0;
  };

  const start = () => {
    if (raf || reduced.matches) return;
    startedAt = performance.now();
    lastDrawn = 0;
    dark = fadeFrom = fadeTo = targetDark();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    ctx.clearRect(0, 0, width, height);
  };

  // while the pointer is pressed, it keeps seeding as it moves: a new seed
  // every DRAG_STEP px, so a drag draws a trail of colonies
  const DRAG_STEP = LATTICE.spacing * 2;
  let pressed = false;
  let lastSeed = { x: 0, y: 0 };
  const seed = (x: number, y: number) => {
    if (pointer.clicks.length < 16) pointer.clicks.push({ x, y });
    lastSeed = { x, y };
  };
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    if (pressed && Math.hypot(e.clientX - lastSeed.x, e.clientY - lastSeed.y) >= DRAG_STEP)
      seed(e.clientX, e.clientY);
  };
  const onLeave = () => (pointer.active = false);
  const onDown = (e: PointerEvent) => {
    // a click on a control is for the control, not for the sky
    if (
      (e.target as Element | null)?.closest("a, button, input, select, textarea, [role='switch']")
    )
      return;
    pressed = true;
    seed(e.clientX, e.clientY);
  };
  const onUp = () => (pressed = false);

  // dev only: lets a browser session read what the loop is doing
  const stats = {
    drawMs: 0,
    get dark() {
      return dark;
    },
    get pointer() {
      return pointer;
    },
  };
  if (import.meta.dev) (window as unknown as { __sky: typeof stats }).__sky = stats;

  resize();
  start();
  addEventListener("resize", resize);
  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", onDown, { passive: true });
  addEventListener("pointerup", onUp, { passive: true });
  addEventListener("pointercancel", onUp, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  reduced.addEventListener("change", () => (reduced.matches ? stop() : start()));

  onBeforeUnmount(() => {
    stop();
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", onDown);
    removeEventListener("pointerup", onUp);
    removeEventListener("pointercancel", onUp);
    document.removeEventListener("pointerleave", onLeave);
  });
});
</script>

<template>
  <canvas ref="canvas" class="sky" aria-hidden="true" />
</template>
