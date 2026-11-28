<script setup lang="ts">
useHead({ title: "expeditions | urs bollhalder" });

// Only active projects, in their given order.
const { data } = await useAsyncData("expeditions", () =>
  queryCollection("projects").where("active", "=", true).order("order", "ASC").all(),
);
const projects = computed(() => data.value ?? []);

const baseURL = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
const asset = (path: string) => baseURL + path;
const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

// The videos play inline, one at a time, in a player that is only put on
// the page when asked for (VideoEmbed, the same as in the posts). The
// player itself silences the ambient music while it plays and brings it
// back when it pauses, ends or is closed.
const showing = ref<string | null>(null);
const show = (path: string) => {
  showing.value = showing.value === path ? null : path;
  // the player sits under the thumbnail on a phone and under the row on a
  // desk; either way, bring it into view in the scrolling panel
  if (showing.value)
    void nextTick(() =>
      document
        .querySelector(".project__player")
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
    );
};
</script>

<template>
  <div class="panel">
    <h1 class="page-title">expeditions</h1>
    <ul class="projects">
      <li v-for="p in projects" :key="p.path" class="project">
        <figure v-if="p.image" class="project__figure">
          <div class="project__thumb">
            <NuxtLink v-if="!p.link && p.post" :to="p.post" class="project__image">
              <img :src="asset(p.image)" :alt="p.title" loading="lazy" />
            </NuxtLink>
            <a v-else :href="p.link" rel="noopener" class="project__image">
              <img :src="asset(p.image)" :alt="p.title" loading="lazy" />
            </a>
            <!-- the play mark over the thumbnail opens the player under the row -->
            <button
              v-if="p.video"
              type="button"
              class="project__play"
              :class="{ 'is-open': showing === p.path }"
              :aria-label="(showing === p.path ? 'Close the video of ' : 'Watch ') + p.title"
              @click="show(p.path)"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path v-if="showing === p.path" d="M4 4h8v8H4z" />
                <path v-else d="M5 3.5v9l7-4.5z" />
              </svg>
            </button>
          </div>
          <figcaption class="project__caption">P-{{ String(p.order).padStart(2, "0") }}</figcaption>
        </figure>
        <div class="project__body">
          <h2 class="project__title">
            <span v-if="!p.image" class="project__caption"
              >P-{{ String(p.order).padStart(2, "0") }}</span
            >
            <NuxtLink v-if="!p.link && p.post" :to="p.post">{{ p.title }}</NuxtLink>
            <a v-else :href="p.link" rel="noopener">{{ p.title }}</a>
            <span v-if="p.year" class="project__year">{{ p.year }}</span>
          </h2>
          <p class="project__text">{{ p.description }}</p>
          <p class="project__meta">
            <span v-for="tag in p.tags" :key="tag" class="tag">{{ tag }}</span>
          </p>
          <p class="project__links">
            <a v-if="p.link" :href="p.link" rel="noopener">{{ host(p.link) }}</a>
            <NuxtLink v-if="p.post" :to="p.post">transmission</NuxtLink>
            <a v-if="p.github && p.github !== p.link" :href="p.github" rel="noopener">github</a>
            <button v-if="p.video" type="button" class="project__watch" @click="show(p.path)">
              {{ showing === p.path ? "close video" : "watch video" }}
            </button>
          </p>
        </div>
        <!-- the player, across the whole row, only while it is wanted -->
        <div v-if="p.video && showing === p.path" class="project__player">
          <VideoEmbed :src="p.video" :title="p.title" autoplay />
        </div>
      </li>
    </ul>
  </div>
</template>
