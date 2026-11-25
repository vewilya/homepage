<script setup lang="ts">
/**
 * An embedded video for a post, written in markdown as
 *   :video-embed{src="https://vimeo.com/123" title="…"}
 * Takes a YouTube or Vimeo page URL and renders the privacy-minded player
 * for it (no cookies, no tracking) in a 16:9 frame, with fullscreen allowed.
 * Nuxt Content registers components in this folder for markdown.
 */
const props = defineProps<{ src: string; title?: string; autoplay?: boolean }>();

// The site's music must not play over a video. A click inside the player
// moves focus into its iframe, which the page sees as a window blur with
// the iframe active, so that is the moment to switch the music off.
const frame = ref<HTMLIFrameElement>();
const { enabled: sound, toggle: toggleSound } = useAmbientAudio();
const onBlur = () => {
  if (document.activeElement === frame.value && sound.value) void toggleSound();
};
onMounted(() => {
  addEventListener("blur", onBlur);
  if (props.autoplay && sound.value) void toggleSound(); // starts on its own
});
onBeforeUnmount(() => removeEventListener("blur", onBlur));

const player = computed(() => {
  const yt = props.src.match(/(?:v=|youtu\.be\/)([\w-]+)/);
  const auto = props.autoplay ? "&autoplay=1" : "";
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0${auto}`;
  const vimeo = props.src.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1${auto}`;
  return props.src;
});
</script>

<template>
  <div class="video-embed">
    <iframe
      ref="frame"
      :src="player"
      :title="title ?? 'Video'"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowfullscreen
      loading="lazy"
    />
  </div>
</template>

<style scoped>
.video-embed {
  aspect-ratio: 16 / 9;
  margin: 1.75rem 0;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: #000;
}
.video-embed iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
