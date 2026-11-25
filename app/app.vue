<script setup lang="ts">
// The icon link carries the base URL so it also resolves under /homepage/
// on a GitHub project page. On the custom domain the base URL is "/".
const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
useHead({
  link: [{ rel: "icon", type: "image/svg+xml", href: `${base}/favicon.svg` }],
});
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
