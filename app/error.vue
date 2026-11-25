<script setup lang="ts">
import type { NuxtError } from "#app";
defineProps<{ error: NuxtError }>();
useHead({ title: "not found | urs bollhalder" });
</script>

<template>
  <NuxtLayout>
    <h1 class="page-title">
      {{ error.statusCode === 404 ? "nothing here" : "something went wrong" }}
    </h1>
    <p class="post__meta">{{ error.statusMessage }}</p>
    <p><a href="#" @click.prevent="clearError({ redirect: '/' })">← back home</a></p>
  </NuxtLayout>
</template>
