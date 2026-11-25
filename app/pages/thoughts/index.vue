<script setup lang="ts">
useHead({ title: "thoughts | urs bollhalder" });

const { data } = await useAsyncData("thoughts-list", () =>
  queryCollection("thoughts").order("date", "DESC").select("path", "title", "date", "draft").all(),
);
const posts = computed(() => (data.value ?? []).filter((p) => !p.draft));
</script>

<template>
  <h1 class="page-title">thoughts</h1>
  <PostList :posts="posts" grouped />
</template>
