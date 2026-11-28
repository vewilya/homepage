<script setup lang="ts">
// The newest post gets a small framed notice under the hero: a kicker that
// says what this is, the title, its one-line description and a prompt to
// read it. The kicker is drawn from a few phrasings, a different one each
// visit; the first is rendered on the server and swapped once mounted, so
// the markup hydrates clean, and the swap hides inside the page's fade-in.
const { data: latest } = await useAsyncData("home-latest", () =>
  queryCollection("thoughts")
    .order("date", "DESC")
    .select("path", "title", "description", "date", "draft")
    .all(),
);
const newest = computed(() => latest.value?.find((p) => !p.draft));

const KICKERS = [
  "latest transmission",
  "last signal received",
  "new from the overlap",
  "fresh in transmissions",
  "most recent dispatch",
];
const kicker = ref(KICKERS[0]!);
onMounted(() => {
  kicker.value = KICKERS[Math.floor(Math.random() * KICKERS.length)]!;
});
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
    <NuxtLink v-if="newest" :to="newest.path" class="hero__latest latest">
      <span class="latest__kicker">{{ kicker }}</span>
      <span class="latest__title">{{ newest.title }}</span>
      <span v-if="newest.description" class="latest__dek">{{ newest.description }}</span>
      <span class="latest__cta">read it <i aria-hidden="true">→</i></span>
    </NuxtLink>
  </section>
</template>
