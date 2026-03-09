<template>
  <div class="portfolio">
    <!-- NAV -->
    <nav class="nav">
      <div class="nav-links">
        <a href="#dev">Audio Development</a>
        <a href="#composer">Music | Sound Design</a>
        <a href="#pianist">Pianist</a>
      </div>
      <button class="nav-icon-btn" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </nav>

    <!-- HERO -->
    <header class="hero">
      <h1>URS BOLLHALDER</h1>
      <p class="subtitle">SOUND ARTIST | AUDIO DEVELOPER</p>
      <h2>Portfolio</h2>
      <div class="hero-portrait" @click="playVideo">
        <img src="@/assets/images/portrait.JPG" alt="Urs Bollhalder" class="profile-img" :class="{ hidden: isVideoPlaying }" />
        <div v-if="isVideoPlaying" class="hero-video-circle">
          <div :id="playerId" />
        </div>
        <button v-if="!isVideoPlaying" class="play-btn" aria-label="Play video">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 19,12 8,19" /></svg>
        </button>
      </div>
      <div class="contact-info">
        <p><strong>Homepage:</strong> <a href="https://www.ursbollhalder.com" target="_blank">www.ursbollhalder.com</a></p>
        <p><strong>Github:</strong> <a href="https://github.com/vewilya" target="_blank">www.github.com/vewilya</a></p>
      </div>
      <div class="social-links">
        <a href="https://www.instagram.com/urs_bollhalder_composer/" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff05122a500b10c1f4076_1.png" alt="Instagram" />
        </a>
        <a href="https://www.linkedin.com/in/ursbollhaldercomposer/" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff0512941d8ff689040f0_3.png" alt="LinkedIn" />
        </a>
        <a href="https://www.youtube.com/channel/UCOv2DBySV101MD4sxbwglpw" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff0514cb1aaa6941d9203_4.png" alt="YouTube" />
        </a>
        <a href="https://github.com/vewilya" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/644842db72b85962f5bb7b28_github-mark.png" alt="GitHub" />
        </a>
        <a href="https://twitter.com/ubcomposer" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff0524714780241875d00_5.png" alt="Twitter/X" />
        </a>
      </div>
      <a href="https://www.linkedin.com/in/ursbollhaldercomposer/" target="_blank" class="cta-btn">CONTACT ME</a>
    </header>

    <!-- PROFILE -->
    <section class="section">
      <h2>PROFILE</h2>
      <p>Having been brought up as the son of a computer programmer and big music enthusiast, I was exposed to both programming languages and what must be called the largest record collection in the Rhine Valley to date from a very early age. Hence, I inherited both a love for binary code and music composition!</p>
      <p>It has always been at this intersection of music and technology where I'm most comfortable and inspired to build things — trying to come up with new ideas of high quality, impact and maybe a little bit of magic.</p>
      <p>Having studied piano performance (summa cum laude) and composition has given me a solid grounding in the art of music performance and composition. A creative mind and a great set of ears inform many of the decisions I make today, both as a music composer and an audio developer.</p>
      <p>I am a quick study, easy to work with and always eager to learn new things or find new and innovative ways to do old ones.</p>
      <p>My name is Urs Bollhalder and I love working as an audio artist | audio developer.</p>
    </section>

    <!-- AUDIO DEVELOPER -->
    <section id="dev" class="section">
      <h2>AUDIO DEVELOPER</h2>
      <h3>Sample Instruments, Plugins & Preset Packs</h3>
      <p>After moving to the Netherlands in summer 2020 with my family, I started to get more and more into creating tools for composers and sound designers. By the end of 2020 I was neck-deep into programming languages like C++, JavaScript, KSP, Python, Julia and Lua, developing standalone instruments, audio plugins, and sample libraries for Native Instruments' Kontakt engine.</p>
      <p>More recently I've been diving into creating audio plugins, combining modern web development stacks like React and Svelte with an up-and-coming audio framework called <a href="https://www.elementary.audio" target="_blank">Elementary Audio</a>.</p>

      <!-- JUCE -->
      <h3>JUCE PLUGINS / C++</h3>

      <div class="project-card">
        <h4>CRANN BETHADH</h4>
        <img src="@/assets/images/CrannBethadh.png" alt="Crann Bethadh" class="img-constrained" />
        <p>A plugin prototype featuring a convolution-based engine with saturation processing and internal oversampling to avoid aliasing artifacts. The plugin engulfs audio in a nebula of sound — warm, fuzzy tails that never sound harsh or brittle.</p>
        <a href="https://github.com/vewilya/Crann-Bethadh" target="_blank" class="link-btn">View on GitHub →</a>
        <div class="video-grid">
          <VideoEmbed src="https://player.vimeo.com/video/815241746" title="Crann Bethadh Demo 1" />
          <VideoEmbed src="https://player.vimeo.com/video/887190556" title="Crann Bethadh Demo 2" />
        </div>
      </div>

      <div class="project-card">
        <h4>CREST</h4>
        <img src="@/assets/images/Screenshot 2023-05-09 at 15.22.04.png" alt="CRest" class="img-constrained" />
        <p>An Analog Filter Emulation in C++. CRest is a growing analog circuit modelling component library, containing filters, saturators and compressors — bringing together classic warmth with modern code.</p>
        <VideoEmbed src="https://player.vimeo.com/video/825002682" title="CRest Demo" />
      </div>

      <!-- KONTAKT -->
      <h3>KONTAKT INSTRUMENT DESIGN & SCRIPTING</h3>

      <div class="project-card">
        <h4>HAVE AUDIO – Mechanics of Noise</h4>
        <img src="@/assets/images/box_mechanics_large.png.webp" alt="Mechanics of Noise" />
        <p>Sound design and instrument programming for the Kontakt library <em>Mechanics of Noise</em>, HAVE Audio 2020.</p>
        <blockquote>"Really digging this library, especially for moody/gritty underscore!" — Wilbert Roget, II (Mortal Kombat 11, Call of Duty: WWII)</blockquote>
        <div class="video-grid">
          <VideoEmbed src="https://www.youtube.com/embed/i4NQcJf-Je0" title="Mechanics of Noise Demo 1" />
          <VideoEmbed src="https://www.youtube.com/embed/BXPHHNdii_A" title="Mechanics of Noise Demo 2" />
        </div>
      </div>

      <div class="project-card">
        <h4>HAVE AUDIO – UCHRONIA</h4>
        <img src="@/assets/images/MAIN_NEW.jpg.webp" alt="Uchronia" />
        <p>Sound design and Kontakt scripting for <em>Uchronia</em>, HAVE Audio 2022/2023. A unique and powerful granular synthesis instrument for Kontakt 6 with 4 independent granular engines, arpeggiators, radar XY pad, and an Entropy randomizer.</p>
        <VideoEmbed src="https://www.youtube.com/embed/9REZUVG1Kf4" title="Uchronia Demo" />
      </div>

      <div class="project-card">
        <h4>HAVE AUDIO – NASTRO VHS</h4>
        <img src="@/assets/images/NASTRO_VHS_GUI.jpg.webp" alt="Nastro VHS" />
        <p>Kontakt scripting for <em>Nastro VHS</em>, HAVE Audio 2023. A powerful time machine — lo-fi devices from reel-to-reel tape recorders to VHS & Betamax, full of beautiful imperfections and fluctuations.</p>
        <VideoEmbed src="https://www.youtube.com/embed/ZUFtWVLxC5s" title="Nastro VHS Demo" />
      </div>

      <div class="project-card">
        <h4>HAVE AUDIO – CATTANEO PIANO</h4>
        <img src="@/assets/images/UPRIGHTPIANO_UI_Pag1_31b62a02-8109-4087-9c1f-92af83a54e84.jpg.webp" alt="Cattaneo Piano" />
        <p>Kontakt scripting for <em>Cattaneo Pianos</em>, HAVE Audio 2023. An intimate, unique-sounding upright piano, an authentic electric piano sampled from a custom-modified Rhodes-type instrument, plus an exclusive Cassette bonus instrument.</p>
        <VideoEmbed src="https://www.youtube.com/embed/II1qb51GYTI" title="Cattaneo Piano Demo" />
      </div>

      <div class="project-card">
        <h4>HAVE AUDIO – UAP</h4>
        <img src="@/assets/images/uap_artwork_2_1920x1080_e3395e53-c96c-44e0-8820-fa5f7c66eb53.png" alt="UAP" />
        <p>Additional scripting for UAP, HAVE Audio 2022, including <strong>DILATION</strong> (spread last played sample across keyboard) and <strong>CASE</strong> (random sample mapping with full FX randomization).</p>
        <VideoEmbed src="https://www.youtube.com/embed/dCMq3MQ0bNE" title="UAP Demo" />
      </div>

      <!-- HISE -->
      <h3>HISE INSTRUMENTS</h3>
      <div class="project-card">
        <h4>Various Prototypes</h4>
        <p>Granular instrument prototypes coded and designed in HISE using JavaScript. Highlights include a granular/arpeggiator hybrid, <strong>Grøth Norskal</strong> — a graphical iOS instrument pairing granular synthesis with a particle system — and <strong>Løfspir Creek</strong>, a percussive sequencer featuring found-sound and field recordings.</p>
        <div class="video-grid">
          <VideoEmbed src="https://player.vimeo.com/video/765188513" title="Prototype I" />
          <VideoEmbed src="https://player.vimeo.com/video/765194417" title="Prototype II" />
          <VideoEmbed src="https://player.vimeo.com/video/765209204" title="Prototype III" />
          <VideoEmbed src="https://player.vimeo.com/video/681591070" title="Prototype IV" />
          <VideoEmbed src="https://player.vimeo.com/video/681587668" title="HISE Prototype I" />
          <VideoEmbed src="https://www.youtube.com/embed/7K_bMU48WEY" title="HISE Prototype II" />
          <VideoEmbed src="https://www.youtube.com/embed/xErq9mLvO1o" title="HISE Prototype III" />
          <VideoEmbed src="https://www.youtube.com/embed/EEqd-1Dh8Ak" title="HISE Prototype IV" />
        </div>
      </div>

      <!-- ELEMENTARY AUDIO -->
      <h3>ELEMENTARY AUDIO & WEB DEVELOPMENT</h3>

      <div class="project-card">
        <h4>BOLGER BLøDGe</h4>
        <p>A tape emulation experiment using Elementary Audio and custom-made assets — inspired by a lifelong fascination with tape machines and the warm, organic textures of analog sound.</p>
        <VideoEmbed src="https://player.vimeo.com/video/819110999" title="Bolger Blødge Demo" />
      </div>

      <div class="project-card">
        <h4>PRESET HANDLER</h4>
        <img src="@/assets/images/Screenshot 2022-07-10 at 11.41.24.png" alt="Preset Handler" class="img-constrained" />
        <p>A Preset Handler component for an audio plugin with a JS/Svelte UI.</p>
        <a href="https://vewilya.github.io/preset-handler/" target="_blank" class="link-btn">View Live Demo →</a>
      </div>

      <div class="project-card">
        <h4>SMUDGE – Saturation Playground</h4>
        <img src="@/assets/images/SMUDGE.png" alt="Smudge" class="img-constrained" />
        <p>A saturation playground to prototype wave shaping functions and saturation algorithms interactively.</p>
        <a href="https://vewilya.github.io/smudge/" target="_blank" class="link-btn">Try it Live →</a>
      </div>

      <div class="project-card">
        <h4>PLUVIAT – A Tempus-Spatial Wonderbox</h4>
        <p>A granular spatial delay plugin in AU/VST3 format, with a code-based UI built with Vite, Svelte and Elementary Audio. All graphics are generated with a healthy degree of randomness, so they never look exactly the same.</p>
        <div class="video-grid-3">
          <VideoEmbed src="https://www.youtube.com/embed/0yls1c7dIWk" title="Pluviat Demo I" />
          <VideoEmbed src="https://www.youtube.com/embed/cWSA8GYomvQ" title="Pluviat Demo II" />
          <VideoEmbed src="https://player.vimeo.com/video/765191038" title="Pluviat Demo III" />
        </div>
      </div>

      <!-- SOUND SETS -->
      <h3>SOUND SETS & SOUND DESIGN</h3>

      <div class="project-card">
        <h4>Claypot Drum Sample Freebie</h4>
        <p>A little sample pack designed out of recordings from a claypot drum that my son had made at school.</p>
        <VideoEmbed src="https://player.vimeo.com/video/681603854" title="Claypot Drum Sample Pack" />
      </div>

      <div class="project-card">
        <h4>s'Gravenhaage – Field Recordings / Arturia Pigments Preset Pack</h4>
        <p>A preset pack for Arturia's Pigments synth, made from field recordings captured in The Hague 2020/21.</p>
        <VideoEmbed src="https://player.vimeo.com/video/681610378" title="s'Gravenhaage" />
      </div>

      <div class="project-card">
        <h4>Pendulate Preset Pack</h4>
        <p>A track featuring sound design and music elements from a self-made preset pack for Pendulate by Newfangled Audio.</p>
        <VideoEmbed src="https://player.vimeo.com/video/681591482" title="Pendulate Preset Pack" />
      </div>

      <div class="project-card">
        <h4>HAVE Audio – Passion & Craft</h4>
        <VideoEmbed src="https://www.youtube.com/embed/SnrKYzbKEHk" title="Have a Passion, Have Audio" />
      </div>
    </section>

    <!-- COMPOSER / SOUND DESIGNER -->
    <section id="composer" class="section">
      <h2>MUSIC COMPOSER | SOUND DESIGNER</h2>

      <div class="project-card">
        <h4>Rückkehr nach Alaska</h4>
          <p>Co-composer and sound designer for an SRF DOK — a beautiful nature documentary featuring the landscape and wildlife of Alaska by Beat Bieri. Part of the international Visual Music team since 2021.</p>
        <VideoEmbed src="https://www.youtube.com/embed/Wi3MqGcvXww" title="Rückkehr nach Alaska" />
      </div>

      <div class="project-card">
        <h4>Le Maître Voleur</h4>
        <p>Music composition for a dialogue- and story-driven game by Inlusio Interactive for Lehrmittelverlag Zürich. A mystery game enabling students to learn French across three chapters. Video game music, 2021.</p>
        <VideoEmbed src="https://player.vimeo.com/video/665379274" title="Le Maître Voleur" />
      </div>

      <div class="project-card">
        <h4>WHEN WE DISAPPEAR</h4>
        <p>Music composition and sound design for a story-driven, reality-inspired puzzle platformer by Inlusio Interactive, created in collaboration with the Centre for History Education and Memory Cultures of the Pädagogische Hochschule Luzern. Video game music and sound design, 2020/21.</p>
        <VideoEmbed src="https://www.youtube.com/embed/ppcfQRU83_c" title="When We Disappear" />
      </div>

      <div class="project-card">
        <h4>OUT OF PARADISE</h4>
        <p>Music composition and production for the feature film <em>Out of Paradise</em>. National premiere at the Solothurn Film Festival 2018, international premiere and winner of the Golden Goblet Award for Best Feature Film at the Shanghai International Film Festival, 2018.</p>
        <VideoEmbed src="https://www.youtube.com/embed/boG5wGOmjI0" title="Out of Paradise" />
      </div>

      <div class="project-card">
        <h4>The Frightening Nightmares of Little Eddy</h4>
        <p>Music composition for a Tim Burton-inspired video game. Video game music, 2020/21.</p>
        <VideoEmbed src="https://www.youtube.com/embed/GNUQRkMLtws" title="The Frightening Nightmares of Little Eddy" />
        <iframe class="soundcloud" scrolling="no" frameborder="no" allow="autoplay"
          src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/urs-bollhalder/sets/the-frightening-nightmare-of-little-eddy&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" />
      </div>

      <div class="project-card">
        <h4>TIKI BALL</h4>
        <p>Music composition and sound design for the video game <em>Tiki Ball</em>. Video game music and sound design, 2019.</p>
        <iframe class="soundcloud" scrolling="no" frameborder="no" allow="autoplay"
          src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/urs-bollhalder/welcome-to-the-island&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" />
      </div>

    </section>

    <!-- PIANIST -->
    <section id="pianist" class="section">
      <h2>PIANIST</h2>
      <p>I discovered my affinity and talent for everything music-related at a very early age. After working my way through large parts of the canon of Western piano literature — from Sweelinck, Byrd, Bach, and Brahms to Schoenberg and Einojuhani Rautavaara — I graduated summa cum laude in 2006 with a Master in Jazz Performance at the Lucerne University of Applied Sciences and Arts.</p>
      <p>I have played a vast number of concerts in and outside of Switzerland since I was a teenager, both as a sideman and as a bandleader. Highlights include the <em>Jazz Festival Montreux</em>, <em>Jazz Festival Berne</em>, <em>12 Points Festival Dublin 2007</em>, and the <em>Jazz Festival Basel</em>.</p>
      <p>This experience greatly informs my work as a media composer today, and improvisation has left an undeniable mark on my mindset when tackling challenges like the development of non-linear music scenarios for video games or finding creative solutions in code!</p>

      <div class="music-links">
        <a href="https://music.apple.com/ch/album/the-portkey/368062265" target="_blank" class="music-link">
          <span class="music-icon">🎵</span>
          <span>The Portkey – CamJazz, 2007</span>
        </a>
        <a href="https://music.apple.com/ch/album/buenos-aires-feat-matthieu-michel-michael-zisman/353535889" target="_blank" class="music-link">
          <span class="music-icon">🎵</span>
          <span>Buenos Aires – feat. Matthieu Michel & Michael Zisman</span>
        </a>
        <a href="https://music.apple.com/ch/album/eventide/1029662214" target="_blank" class="music-link">
          <span class="music-icon">🎵</span>
          <span>Eventide – Musiques Suisses, 2015</span>
        </a>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="social-links">
        <a href="https://www.instagram.com/urs_bollhalder_composer/" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff05122a500b10c1f4076_1.png" alt="Instagram" />
        </a>
        <a href="https://www.linkedin.com/in/ursbollhaldercomposer/" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff0512941d8ff689040f0_3.png" alt="LinkedIn" />
        </a>
        <a href="https://www.youtube.com/channel/UCOv2DBySV101MD4sxbwglpw" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff0514cb1aaa6941d9203_4.png" alt="YouTube" />
        </a>
        <a href="https://github.com/vewilya" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/6459f2f4219bf17d1d0b6c4d_github-mark-white.png" alt="GitHub" />
        </a>
        <a href="https://twitter.com/ubcomposer" target="_blank">
          <img src="https://cdn.prod.website-files.com/61dab872581faf28e66ed348/61dff0524714780241875d00_5.png" alt="Twitter/X" />
        </a>
      </div>
      <p class="copyright">© {{ currentYear }} Urs Bollhalder. All musical material, sound design and software is under copyright and cannot be used commercially or otherwise.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue'
import VideoEmbed from './VideoEmbed.vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggle: toggleTheme } = useTheme()
const currentYear = new Date().getFullYear()
interface YTPlayer {
  destroy: () => void
}
interface YTEvent {
  data: number
}

const isVideoPlaying = ref(false)
const playerId = 'hero-yt-player'
const videoId = 'xCMPWFKIR34'
let player: YTPlayer | null = null

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    const win = window as unknown as Record<string, unknown>
    if ((win.YT as Record<string, unknown>)?.Player) {
      resolve()
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    win.onYouTubeIframeAPIReady = () => resolve()
  })
}

async function playVideo() {
  if (isVideoPlaying.value) return
  isVideoPlaying.value = true
  await nextTick()
  await loadYTApi()
  const YT = (window as unknown as Record<string, Record<string, unknown>>).YT
  if (!YT) return
  player = new (YT.Player as unknown as new (...args: unknown[]) => YTPlayer)(playerId, {
    videoId,
    playerVars: { autoplay: 1, rel: 0, modestbranding: 1, controls: 0 },
    events: {
      onStateChange: (e: YTEvent) => {
        if (e.data === 0) {
          isVideoPlaying.value = false
          player?.destroy()
          player = null
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

<style scoped>
.portfolio {
  color: var(--color-text);
  line-height: 1.6;
}

/* NAV */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-divider);
}
.nav-links {
  display: flex;
  gap: 2rem;
  font-size: 0.8rem;
  font-weight: 300;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.nav-icon-btn {
  position: absolute;
  right: 2rem;
  background: none;
  border: 1px solid var(--color-divider);
  border-radius: 4px;
  padding: 0.4rem;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color 0.3s, border-color 0.3s;
  display: flex;
  align-items: center;
}
.nav-icon-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent-dim);
}
.nav-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* HERO */
.hero {
  text-align: center;
  padding: 5rem 2rem 3rem;
}
.hero h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--color-text-heading);
}
.subtitle {
  font-size: 0.9rem;
  letter-spacing: 0.25em;
  color: var(--color-accent);
  margin: 0.5rem 0 2rem;
  text-transform: uppercase;
  font-weight: 300;
}
.hero h2 {
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 0.2em;
  color: var(--color-text-muted);
  margin-bottom: 2rem;
  text-transform: uppercase;
}
.hero-portrait {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 2rem;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-accent-dim);
  cursor: pointer;
  transition: border-color 0.3s;
}
.hero-portrait:hover {
  border-color: var(--color-accent);
}
.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: opacity 0.4s;
}
.profile-img.hidden {
  opacity: 0;
  position: absolute;
}
.hero-video-circle {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-video-circle iframe {
  width: 426px;
  height: 240px;
  border: none;
}
.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: var(--color-accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s, transform 0.3s, opacity 0.3s;
  backdrop-filter: blur(4px);
  opacity: 0;
}
.hero-portrait:hover .play-btn {
  opacity: 1;
}
.play-btn svg {
  width: 22px;
  height: 22px;
  margin-left: 2px;
}
.play-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translate(-50%, -50%) scale(1.1);
}
.contact-info {
  font-size: 0.9rem;
  font-weight: 300;
  margin-bottom: 1.5rem;
  color: var(--color-text-muted);
}
.contact-info p { margin: 0.3rem 0; }
.social-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}
.social-links img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  opacity: 0.6;
  transition: opacity 0.3s;
}
.social-links img:hover { opacity: 1; }
.cta-btn {
  display: inline-block;
  padding: 0.6rem 2.5rem;
  border: 1px solid var(--color-accent-dim);
  color: var(--color-accent);
  letter-spacing: 0.15em;
  font-size: 0.85rem;
  font-weight: 300;
  text-transform: uppercase;
  border-radius: 2px;
  transition: border-color 0.3s, background 0.3s, color 0.3s;
}
.cta-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-glow);
}
/* SECTIONS */
.section {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--section-gap) 2rem;
  border-bottom: 1px solid var(--color-divider);
}
.section h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 300;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-heading);
  margin-bottom: 1.5rem;
}
.section h3 {
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  margin: 2.5rem 0 1rem;
  border-left: 2px solid var(--color-accent);
  padding-left: 0.75rem;
}
.section p {
  margin-bottom: 1.2rem;
  color: var(--color-text-muted);
  font-weight: 300;
  line-height: 1.8;
}

/* CARDS */
.project-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-accent-dim);
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: border-color 0.3s, background 0.3s;
}
.project-card:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-glow);
}
.project-card h4 {
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-heading);
  margin-bottom: 1rem;
}
.project-card img {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: 2px;
  margin-bottom: 1rem;
}
.project-card img.img-constrained {
  max-height: 220px;
  object-fit: contain;
}
.project-card blockquote {
  border-left: 2px solid var(--color-accent);
  padding-left: 1rem;
  color: var(--color-text-muted);
  font-style: italic;
  font-weight: 300;
  margin: 1rem 0;
  font-size: 0.9rem;
}
.soundcloud {
  display: block;
  width: 100%;
  height: 166px;
  margin-top: 1rem;
  border-radius: 2px;
}

/* VIDEO */
.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}
.video-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}
@media (max-width: 640px) {
  .video-grid,
  .video-grid-3 {
    grid-template-columns: 1fr;
  }
}

/* LINKS */
.link-btn {
  display: inline-block;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s;
}
.link-btn:hover { border-color: var(--color-accent); }

/* PLACEHOLDER */
.img-placeholder {
  width: 100%;
  min-height: 180px;
  background: var(--color-bg-mute);
  border: 1px dashed var(--color-accent-dim);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
  font-size: 0.8rem;
  font-weight: 300;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

/* MUSIC LINKS */
.music-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.music-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--color-card-bg);
  border: 1px solid var(--color-accent-dim);
  border-radius: 4px;
  padding: 0.85rem 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 300;
  transition: border-color 0.3s, color 0.3s, background 0.3s;
}
.music-link:hover {
  border-color: var(--color-accent);
  color: var(--color-text-heading);
  background: var(--color-accent-glow);
}
.music-icon { font-size: 1.1rem; }

/* FOOTER */
.footer {
  text-align: center;
  padding: 3rem 2rem;
  border-top: 1px solid var(--color-divider);
}
.footer-email {
  display: block;
  margin: 1.5rem 0 1rem;
  font-size: 0.9rem;
  font-weight: 300;
}
.copyright {
  font-size: 0.75rem;
  font-weight: 300;
  color: var(--color-text-dim);
  max-width: 600px;
  margin: 0 auto;
}

/* RESPONSIVE */
@media (max-width: 480px) {
  .nav {
    padding: 0.75rem 1rem;
  }
  .nav-links {
    gap: 1rem;
    font-size: 0.7rem;
  }
  .nav-icon-btn {
    right: 1rem;
  }
}
</style>