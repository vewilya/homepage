<script setup lang="ts">
useHead({ title: "transmissions | urs bollhalder" });

const { data } = await useAsyncData("thoughts-list", () =>
  queryCollection("thoughts").order("date", "DESC").select("path", "title", "date", "draft").all(),
);
const posts = computed(() => (data.value ?? []).filter((p) => !p.draft));
</script>

<template>
  <div>
    <h1 class="page-title">transmissions</h1>
    <PostList :posts="posts" grouped />
  </div>
</template>
