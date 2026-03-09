<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
let animId = 0

/*
  Each "block" is a rectangular dot grid that:
  1. Appears at a random viewport position
  2. Dots illuminate one by one in a ripple/wave pattern
  3. Stays fully lit briefly
  4. Fades out slowly
  5. Then a new block spawns with different size/position
*/

interface GridBlock {
  // Position (viewport-relative, adjusted for scroll)
  x: number
  scrollAnchor: number // scrollY when created — stays fixed in page
  // Grid dimensions
  cols: number
  rows: number
  spacing: number
  dotSize: number
  // Lifecycle (seconds)
  born: number       // time when created
  fadeInDur: number   // how long dots take to all appear
  holdDur: number     // how long fully lit
  fadeOutDur: number  // how long to disappear
  // Per-dot timing: delay before each dot starts fading in
  dotDelays: number[]
  // Direction of the illumination wave
  waveAngle: number
}

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  let W = 0
  let H = 0
  let t = 0

  const MAX_BLOCKS = 3
  const blocks: GridBlock[] = []
  let nextSpawn = 0

  function rand(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  function spawnBlock() {
    const cols = Math.floor(rand(6, 22))
    const rows = Math.floor(rand(5, 16))
    const spacing = rand(8, 15)
    const waveAngle = rand(0, Math.PI * 2)

    // Compute per-dot delay based on wave direction
    const dotDelays: number[] = []
    let maxDist = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = c * Math.cos(waveAngle) + r * Math.sin(waveAngle)
        dotDelays.push(dist)
        if (Math.abs(dist) > maxDist) maxDist = Math.abs(dist)
      }
    }
    // Normalize delays to 0..1
    const minDist = Math.min(...dotDelays)
    for (let i = 0; i < dotDelays.length; i++) {
      dotDelays[i] = (dotDelays[i]! - minDist) / (maxDist - minDist + 0.001)
    }

    const block: GridBlock = {
      x: rand(W * 0.05, W - cols * spacing - 20),
      scrollAnchor: window.scrollY + rand(H * 0.1, H * 0.8),
      cols,
      rows,
      spacing,
      dotSize: rand(1, 2),
      born: t,
      fadeInDur: rand(2, 5),
      holdDur: rand(1.5, 4),
      fadeOutDur: rand(2, 5),
      dotDelays,
      waveAngle,
    }

    blocks.push(block)
  }

  function resize() {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
  }

  window.addEventListener('resize', resize)
  resize()

  function loop() {
    animId = requestAnimationFrame(loop)
    ctx.clearRect(0, 0, W, H)

    const scrollY = window.scrollY

    // Spawn new blocks
    if (t >= nextSpawn && blocks.length < MAX_BLOCKS) {
      spawnBlock()
      nextSpawn = t + rand(1.5, 4)
    }

    // Draw and cull blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i]!
      const age = t - b.born
      const totalLife = b.fadeInDur + b.holdDur + b.fadeOutDur

      // Remove dead blocks
      if (age > totalLife) {
        blocks.splice(i, 1)
        continue
      }

      const baseY = b.scrollAnchor - scrollY

      // Skip if entirely off screen
      const gridH = b.rows * b.spacing
      if (baseY + gridH < -20 || baseY > H + 20) continue

      // Draw each dot
      let dotIdx = 0
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          const delay = b.dotDelays[dotIdx]! * b.fadeInDur
          const dotAge = age - delay

          let alpha = 0
          if (dotAge < 0) {
            // Not yet visible
            alpha = 0
          } else if (dotAge < b.fadeInDur * 0.3) {
            // Fading in
            alpha = dotAge / (b.fadeInDur * 0.3)
          } else if (age < b.fadeInDur + b.holdDur) {
            // Fully lit — gentle pulse
            alpha = 0.7 + 0.3 * Math.sin(t * 1.5 + c * 0.4 + r * 0.3)
          } else {
            // Fading out
            const fadeProgress = (age - b.fadeInDur - b.holdDur) / b.fadeOutDur
            alpha = Math.max(0, 1 - fadeProgress)
          }

          if (alpha <= 0.01) {
            dotIdx++
            continue
          }

          const dx = b.x + c * b.spacing
          const dy = baseY + r * b.spacing

          if (dy < -5 || dy > H + 5) {
            dotIdx++
            continue
          }

          ctx.fillStyle = `rgba(126,184,201,${alpha * 0.45})`
          ctx.beginPath()
          ctx.arc(dx, dy, b.dotSize, 0, Math.PI * 2)
          ctx.fill()

          dotIdx++
        }
      }
    }

    t += 0.016 // ~60fps in seconds
  }

  // Spawn first block immediately
  spawnBlock()
  nextSpawn = t + rand(2, 4)

  loop()

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<template>
  <canvas ref="canvasRef" class="particles" />
</template>

<style scoped>
.particles {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
</style>
