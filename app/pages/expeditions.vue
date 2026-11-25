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
</script>

<template>
  <div class="panel">
    <h1 class="page-title">expeditions</h1>
    <ul class="projects">
      <li v-for="p in projects" :key="p.path" class="project">
        <a v-if="p.image" :href="p.link" rel="noopener" class="project__image">
          <img :src="asset(p.image)" :alt="p.title" loading="lazy" />
        </a>
        <div class="project__body">
          <h2 class="project__title">
            <a :href="p.link" rel="noopener">{{ p.title }}</a>
            <span v-if="p.year" class="project__year">{{ p.year }}</span>
          </h2>
          <p class="project__text">{{ p.description }}</p>
          <p class="project__meta">
            <span v-for="tag in p.tags" :key="tag" class="tag">{{ tag }}</span>
          </p>
          <p class="project__links">
            <a :href="p.link" rel="noopener">{{ host(p.link) }}</a>
            <a v-if="p.github && p.github !== p.link" :href="p.github" rel="noopener">github</a>
            <a v-if="p.video && p.video !== p.link" :href="p.video" rel="noopener">video</a>
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
