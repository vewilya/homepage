<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
let animId = 0

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  let W = 0
  let H = 0
  let t = 0

  function resize() {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  const bands = [
    { y: 0.35, color: '80,160,180', amp: 60, freq: 0.6, speed: 0.12 },
    { y: 0.45, color: '60,120,100', amp: 50, freq: 0.8, speed: 0.09 },
    { y: 0.55, color: '100,80,160', amp: 40, freq: 0.5, speed: 0.15 },
  ]

  function loop() {
    animId = requestAnimationFrame(loop)
    ctx.clearRect(0, 0, W, H)
    for (const b of bands) {
      ctx.beginPath()
      for (let x = 0; x <= W; x += 4) {
        const y =
          b.y * H +
          Math.sin(x * b.freq * 0.01 + t * b.speed) * b.amp +
          Math.sin(x * 0.005 + t * 0.2) * 20
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, b.y * H - b.amp, 0, b.y * H + b.amp + 80)
      grad.addColorStop(0, `rgba(${b.color},0)`)
      grad.addColorStop(0.4, `rgba(${b.color},0.18)`)
      grad.addColorStop(1, `rgba(${b.color},0)`)
      ctx.fillStyle = grad
      ctx.fill()
    }
    t += 0.015
  }
  loop()

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<template>
  <canvas ref="canvasRef" class="aurora" />
</template>

<style scoped>
.aurora {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: var(--aurora-opacity);
  transition: opacity 0.4s;
  pointer-events: none;
}
</style>
