<script setup lang="ts">
/**
 * Posts as "date  title" rows. With `grouped` the rows are split by year
 * under a small year heading, as on the thoughts index.
 */
type Row = { path: string; title: string; date: string };

const props = defineProps<{ posts: Row[]; grouped?: boolean }>();

const groups = computed(() => {
  const byYear = new Map<number, Row[]>();
  for (const post of props.posts) {
    const year = yearOf(post.date);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(post);
  }
  return [...byYear.entries()];
});
</script>

<template>
  <template v-if="grouped">
    <section v-for="[year, rows] in groups" :key="year" class="post-group">
      <h2 class="post-group__year">{{ year }}</h2>
      <ul class="post-list">
        <li v-for="post in rows" :key="post.path">
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          <NuxtLink :to="post.path">{{ post.title }}</NuxtLink>
        </li>
      </ul>
    </section>
  </template>
  <ul v-else class="post-list">
    <li v-for="post in posts" :key="post.path">
      <time :datetime="post.date">{{ formatDate(post.date) }}</time>
      <NuxtLink :to="post.path">{{ post.title }}</NuxtLink>
    </li>
  </ul>
</template>
