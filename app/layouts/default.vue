<script setup lang="ts">
const route = useRoute();
const isHome = computed(() => route.path === "/");

// Public files need the base URL in front on a GitHub project page.
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
const asset = (path: string) => baseURL + path;

// One picture per kind of page and per mode. Both layers are always in the
// DOM; the stylesheet fades the current mode's layer in and the other out.
const PICTURES = {
  home: { dark: "twin-moons", light: "moonlit-astronaut" },
  thoughts: { dark: "rocket-snowy-peaks", light: "retro-rocket" },
  inner: { dark: "galactic-mountains", light: "starlit-planets" },
} as const;
const pictures = computed(() => {
  const kind = isHome.value
    ? "home"
    : route.path === "/thoughts" || route.path === "/expeditions"
      ? "thoughts"
      : "inner";
  const pick = PICTURES[kind];
  return {
    dark: asset(`/images/dark/${pick.dark}.webp`),
    light: asset(`/images/light/${pick.light}.webp`),
  };
});
const PAGE_FADE_MS = 6000; // matches .bg-enter-active in main.css
const year = new Date().getFullYear();
// the "/" link prefixes every route, and a post is not a child route of the
// index in the router's eyes, so both active states are decided by path here
const onTransmissions = computed(() => route.path.startsWith("/thoughts"));
// the panel number of the current page, as on the console's zone diagram
const zone = computed(() => (isHome.value ? "01" : route.path === "/expeditions" ? "02" : "03"));

const {
  enabled: sound,
  pending: soundPending,
  nowPlaying,
  artist,
  toggle: toggleSound,
} = useAmbientAudio();
// the radio display's line: what plays, or what the visitor has to do first
const radioLine = computed(() =>
  soundPending.value ? "touch to start" : nowPlaying.value ? `${nowPlaying.value} · ${artist}` : "",
);
</script>

<template>
  <div class="site" :class="isHome ? 'site--home' : 'site--inner'">
    <div class="site-bg" aria-hidden="true">
      <!-- outer layer: which mode shows; inner picture: fades in over the previous one on a page change -->
      <div class="site-bg__layer site-bg__layer--dark">
        <Transition name="bg" :duration="PAGE_FADE_MS">
          <div
            :key="pictures.dark"
            class="site-bg__picture"
            :style="{ backgroundImage: `url(${pictures.dark})` }"
          />
        </Transition>
      </div>
      <div class="site-bg__layer site-bg__layer--light">
        <Transition name="bg" :duration="PAGE_FADE_MS">
          <div
            :key="pictures.light"
            class="site-bg__picture"
            :style="{ backgroundImage: `url(${pictures.light})` }"
          />
        </Transition>
      </div>
      <!-- reading pages: the veil deepens to the ground towards the footer -->
      <div class="site-bg__ground" />
    </div>
    <SkyDecor />
    <SkyCanvas />

    <header class="site-header">
      <NuxtLink to="/" class="site-name">urs bollhalder</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/" :class="{ 'is-active': isHome }"><i>01</i>earthbound</NuxtLink>
        <NuxtLink to="/expeditions" :class="{ 'is-active': route.path === '/expeditions' }"
          ><i>02</i>expeditions</NuxtLink
        >
        <NuxtLink to="/thoughts" :class="{ 'is-active': onTransmissions }"
          ><i>03</i>transmissions</NuxtLink
        >
      </nav>
    </header>

    <!-- the corner cluster, pinned to the window outside the column: the
         small mode switch (the home screen has the large one) and the sound -->
    <!-- the corner: the sound control in a panel frame. The mode is switched
         on the home screen only. -->
    <div class="corner">
      <div class="panel-group">
        <!-- the radio display: a narrow window scrolling the current track,
             like a car radio; dark while sound is off -->
        <Transition name="fade">
          <span v-if="radioLine" class="radio" aria-live="polite">
            <span class="radio__tape" :class="{ 'is-still': soundPending }">
              <span class="radio__text">{{ radioLine }}</span>
              <span class="radio__text" aria-hidden="true">{{ radioLine }}</span>
            </span>
          </span>
        </Transition>
        <!-- an event light: a small square that lights when sound is on -->
        <button
          type="button"
          class="mode-switch mode-switch--small sound-toggle"
          :class="{ 'is-on': sound, 'is-armed': soundPending }"
          role="switch"
          :aria-checked="sound"
          aria-label="Sound"
          @click="toggleSound"
        >
          <span class="mode-switch__label">sound</span>
          <span class="sound-toggle__disc" aria-hidden="true" />
        </button>
      </div>
    </div>

    <main class="site-main">
      <slot />
    </main>

    <footer class="site-footer">
      <span><b class="zone">{{ zone }}</b>© {{ year }} by Urs Bollhalder</span>
      <span class="site-footer__links">
        <a href="https://linkedin.com/in/ursbollhaldercomposer" rel="noopener">LinkedIn</a>
        <a href="https://github.com/vewilya" rel="noopener">Github</a>
      </span>
    </footer>
  </div>
</template>
