<script setup lang="ts">
// The icon links carry the base URL so they also resolve under /homepage/
// on a GitHub project page. On the custom domain the base URL is "/".
// The "ub." monogram: SVG for modern browsers, a multi-size ICO for the
// rest, and a 180px PNG for the iOS home screen.
const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
useHead({
  link: [
    { rel: "icon", href: `${base}/favicon.ico`, sizes: "16x16 32x32 48x48" },
    { rel: "icon", type: "image/svg+xml", href: `${base}/favicon.svg` },
    { rel: "apple-touch-icon", sizes: "180x180", href: `${base}/apple-touch-icon.png` },
  ],
});
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
