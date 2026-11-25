<script setup lang="ts">
const route = useRoute();

const { data: post } = await useAsyncData("thought-" + route.path, () =>
  queryCollection("thoughts").path(route.path).first(),
);

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found", fatal: true });
}

// Neighbours in date order: [0] is the newer post, [1] the older one.
const { data: around } = await useAsyncData("thought-around-" + route.path, () =>
  queryCollectionItemSurroundings("thoughts", route.path, { fields: ["title", "date"] }).order(
    "date",
    "DESC",
  ),
);
const newer = computed(() => around.value?.[0]);
const older = computed(() => around.value?.[1]);

useHead({ title: `${post.value.title} | urs bollhalder` });
useSeoMeta({ description: post.value.description });
</script>

<template>
  <article v-if="post" class="post panel">
    <header class="post__header">
      <h1 class="page-title">{{ post.title }}</h1>
      <p class="post__meta">
        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        <span v-if="post.location" class="post__location">{{ post.location }}</span>
        <template v-if="post.tags?.length">
          <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
        </template>
      </p>
    </header>
    <div class="prose">
      <ContentRenderer :value="post" />
    </div>
    <nav class="post-nav" aria-label="Neighbouring posts">
      <NuxtLink v-if="newer" :to="newer.path">← {{ newer.title }}</NuxtLink>
      <span v-else />
      <NuxtLink v-if="older" :to="older.path">{{ older.title }} →</NuxtLink>
    </nav>
  </article>
</template>
