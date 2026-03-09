<template>
  <div class="video-wrapper">
    <iframe
      :src="embedSrc"
      :title="title"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src: string
  title: string
}>()

const embedSrc = computed(() => {
  if (!props.src.includes('youtube.com')) return props.src
  const separator = props.src.includes('?') ? '&' : '?'
  return `${props.src}${separator}rel=0`
})
</script>

<style scoped>
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
  border-radius: 4px;
  background: #111;
}
.video-wrapper iframe {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
}
</style>