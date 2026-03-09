import { ref } from 'vue'
import audioSrc from '@/assets/audio/20_SfmS_CITY SUNDOWN (LOOP).mp3'

const TARGET_VOLUME = 0.3
const FADE_DURATION = 2000
const FADE_STEP = 30

const audio = new Audio(audioSrc)
audio.loop = true
audio.volume = 0

const isPlaying = ref(false)
let fadeInterval: ReturnType<typeof setInterval> | null = null

function clearFade() {
  if (fadeInterval) {
    clearInterval(fadeInterval)
    fadeInterval = null
  }
}

function fadeIn() {
  clearFade()
  audio.volume = 0
  audio.play()
  const steps = FADE_DURATION / FADE_STEP
  const increment = TARGET_VOLUME / steps
  fadeInterval = setInterval(() => {
    audio.volume = Math.min(audio.volume + increment, TARGET_VOLUME)
    if (audio.volume >= TARGET_VOLUME) {
      clearFade()
    }
  }, FADE_STEP)
}

function fadeOut() {
  clearFade()
  const steps = FADE_DURATION / FADE_STEP
  const decrement = audio.volume / steps
  fadeInterval = setInterval(() => {
    audio.volume = Math.max(audio.volume - decrement, 0)
    if (audio.volume <= 0) {
      audio.pause()
      clearFade()
    }
  }, FADE_STEP)
}

export function useBackgroundAudio() {
  function toggle() {
    if (isPlaying.value) {
      fadeOut()
    } else {
      fadeIn()
    }
    isPlaying.value = !isPlaying.value
  }

  return { isPlaying, toggle }
}
