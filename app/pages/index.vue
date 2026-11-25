<script setup lang="ts">
// The newest post gets one quiet line under the hero.
const { data: latest } = await useAsyncData("home-latest", () =>
  queryCollection("thoughts").order("date", "DESC").select("path", "title", "date", "draft").all(),
);
const newest = computed(() => latest.value?.find((p) => !p.draft));
</script>

<template>
  <section class="hero">
    <h1 class="hero__name">urs bollhalder</h1>
    <!-- two tiers: the title line, then its explanation as a dek -->
    <p class="hero__tagline">Into Sound and Space</p>
    <p class="hero__dek">
      Crafting silence, designing the wave, and shaping the spaces where it unfolds
    </p>
    <p class="hero__roles">
      <span>Creative Technologist</span><span>Artist</span><span>Developer</span>
    </p>
    <div class="hero__switch">
      <ModeSwitch size="large" />
    </div>
    <p class="hero__links">
      <a href="https://github.com/vewilya" rel="noopener">GitHub</a>
      <a href="https://linkedin.com/in/ursbollhaldercomposer" rel="noopener">LinkedIn</a>
    </p>
    <p v-if="newest" class="hero__latest">
      latest transmission · <NuxtLink :to="newest.path">{{ newest.title }}</NuxtLink>
    </p>
  </section>
</template>
