<script setup lang="ts">
const route = useRoute();
const isHome = computed(() => route.path === "/");

// Public files need the base URL in front on a GitHub project page.
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
const asset = (path: string) => baseURL + path;

// One picture per kind of page and per mode. Both layers are always in the
// DOM; the stylesheet fades the current mode's layer in and the other out.
const PICTURES = {
  home: { dark: "twin-moons", light: "retro-astronaut" },
  thoughts: { dark: "rocket-snowy-peaks", light: "retro-rocket" },
  inner: { dark: "galactic-mountains", light: "starlit-planets" },
} as const;
const pictures = computed(() => {
  const kind = isHome.value ? "home" : route.path === "/thoughts" ? "thoughts" : "inner";
  const pick = PICTURES[kind];
  return {
    dark: asset(`/images/dark/${pick.dark}.webp`),
    light: asset(`/images/light/${pick.light}.webp`),
  };
});
const PAGE_FADE_MS = 3000; // matches .bg-enter-active in main.css
const year = new Date().getFullYear();
// the "/" link prefixes every route, and a post is not a child route of the
// index in the router's eyes, so both active states are decided by path here
const onTransmissions = computed(() => route.path.startsWith("/thoughts"));
// a single post is the one page allowed to scroll
const isPost = computed(() => onTransmissions.value && route.path !== "/thoughts");

const { enabled: sound, toggle: toggleSound } = useAmbientAudio();
</script>

<template>
  <div class="site" :class="[isHome ? 'site--home' : 'site--inner', { 'site--post': isPost }]">
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
    </div>
    <SkyCanvas />

    <header class="site-header">
      <NuxtLink to="/" class="site-name">urs bollhalder</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/" :class="{ 'is-active': isHome }">earthbound</NuxtLink>
        <NuxtLink to="/thoughts" :class="{ 'is-active': onTransmissions }">transmissions</NuxtLink>
        <!-- the home screen carries the large switch instead -->
        <ModeSwitch v-if="!isHome" size="small" />
      </nav>
    </header>

    <!-- pinned to the upper right corner of the window, outside the column -->
    <button
      type="button"
      class="sound-toggle"
      :class="{ 'is-on': sound }"
      :aria-pressed="sound"
      :aria-label="sound ? 'Turn sound off' : 'Turn sound on'"
      @click="toggleSound"
    >
      <span class="sound-toggle__dot" aria-hidden="true" />sound
    </button>

    <main class="site-main">
      <slot />
    </main>

    <footer class="site-footer">
      <span>© {{ year }} urs bollhalder</span>
      <span class="site-footer__links">
        <a href="https://github.com/vewilya" rel="noopener">github</a>
        <a href="https://linkedin.com/in/ursbollhaldercomposer" rel="noopener">linkedin</a>
      </span>
    </footer>
  </div>
</template>
