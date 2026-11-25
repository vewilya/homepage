<script setup lang="ts">
// Plain markdown pages from the `pages` collection: content/foo.md -> /foo
const route = useRoute();

const { data: page } = await useAsyncData("page-" + route.path, () =>
  queryCollection("pages").path(route.path).first(),
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found", fatal: true });
}

useHead({ title: `${page.value.title} | urs bollhalder` });
useSeoMeta({ description: page.value.description });
</script>

<template>
  <article v-if="page">
    <h1 class="page-title">{{ page.title }}</h1>
    <div class="prose">
      <ContentRenderer :value="page" />
    </div>
  </article>
</template>
