<script setup lang="ts">
const route = useRoute();
const isHome = computed(() => route.path === "/");

// Public files need the base URL in front on a GitHub project page.
const baseURL = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
const asset = (path: string) => baseURL + path;

// One picture per kind of page. The stylesheet decides whether it shows at
// all: visible in dark mode, hidden in light.
const background = computed(() => {
  const picture = isHome.value
    ? "retro-astronaut"
    : route.path === "/thoughts"
      ? "retro-rocket"
      : "starlit-planets";
  return asset(`/images/dark/${picture}.webp`);
});
const year = new Date().getFullYear();
</script>

<template>
  <div class="site" :class="isHome ? 'site--home' : 'site--inner'">
    <div class="site-bg" aria-hidden="true" :style="{ backgroundImage: `url(${background})` }" />

    <header class="site-header">
      <NuxtLink to="/" class="site-name">urs bollhalder</NuxtLink>
      <nav class="site-nav" aria-label="Primary">
        <NuxtLink to="/thoughts">thoughts</NuxtLink>
      </nav>
    </header>

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
