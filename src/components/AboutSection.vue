<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'

interface YTPlayer { destroy: () => void }
interface YTEvent { data: number }

const isVideoPlaying = ref(false)
const playerId = 'about-yt-player'
const videoId = 'xCMPWFKIR34'
let player: YTPlayer | null = null

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    const win = window as unknown as Record<string, unknown>
    if (win.YT && (win.YT as Record<string, unknown>).Player) {
      resolve()
      return
    }
    const prev = win.onYouTubeIframeAPIReady as (() => void) | undefined
    win.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
}

async function playVideo() {
  if (isVideoPlaying.value) return
  isVideoPlaying.value = true
  await loadYTApi()
  await nextTick()
  const YT = (window as unknown as Record<string, Record<string, unknown>>).YT
  player = new (YT.Player as unknown as new (...args: unknown[]) => YTPlayer)(playerId, {
    videoId,
    playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 },
    events: {
      onStateChange: (e: YTEvent) => {
        if (e.data === 0) {
          player?.destroy()
          player = null
          isVideoPlaying.value = false
        }
      },
    },
  })
}

onBeforeUnmount(() => {
  player?.destroy()
  player = null
})
</script>

<template>
  <section id="about">
    <h2>About Me</h2>
    <div class="about-layout">
      <div class="portrait" @click="playVideo">
        <img
          src="@/assets/images/portrait.JPG"
          alt="Urs Bollhalder"
          class="profile-img"
          :class="{ hidden: isVideoPlaying }"
        />
        <div v-if="isVideoPlaying" class="video-circle">
          <div :id="playerId" />
        </div>
        <button v-if="!isVideoPlaying" class="play-btn" aria-label="Play video">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19" /></svg>
        </button>
      </div>
      <div class="content">
        <p>
          I'm an audio artist and developer based in Switzerland, working at the crossroads of sound
          design, music production, and software engineering. With a background in both creative arts
          and technology, I build tools and experiences that bring sound to life in new ways.
        </p>
        <p>
          Whether it's crafting immersive soundscapes, developing audio plugins, or building web
          applications, I'm driven by curiosity and a love for making things that resonate — both
          sonically and visually.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-layout {
  display: flex;
  align-items: flex-start;
  gap: 2.5rem;
}

.portrait {
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: var(--color-bg-mute);
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.4s;
}

.profile-img.hidden {
  opacity: 0;
  position: absolute;
}

.video-circle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-circle :deep(iframe) {
  width: 320px;
  height: 180px;
  border: none;
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.4);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.portrait:hover .play-btn {
  opacity: 1;
}

.play-btn svg {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.9);
}

.content {
  max-width: 600px;
}

p {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text-muted);
  font-weight: 300;
}

p + p {
  margin-top: 1.2rem;
}

@media (max-width: 600px) {
  .about-layout {
    flex-direction: column;
    align-items: center;
  }

  .content {
    text-align: center;
  }
}
</style>
