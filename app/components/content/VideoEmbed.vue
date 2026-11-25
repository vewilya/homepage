<script setup lang="ts">
/**
 * An embedded video for a post, written in markdown as
 *   :video-embed{src="https://vimeo.com/123" title="…" poster="/images/…webp"}
 * Takes a YouTube or Vimeo page URL and renders the privacy-minded player
 * for it (no cookies, no tracking) in a 16:9 frame, with fullscreen allowed.
 * With a poster, the frame first shows that still under the play disc and
 * only loads the player, autoplaying, when the disc is clicked: nothing of
 * the host's is fetched until then, and its own still never shows.
 * Nuxt Content registers components in this folder for markdown.
 */
const props = defineProps<{ src: string; title?: string; autoplay?: boolean; poster?: string }>();
const base = useRuntimeConfig().app.baseURL.replace(/\/+$/, "");
const asset = (path: string) => (path.startsWith("/") ? base + path : path);

// with a poster the player waits for the click; without one it is there at once
const started = ref(!props.poster);
const start = () => {
  started.value = true;
  if (sound.value) void toggleSound();
};

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
  const auto = props.autoplay || props.poster ? "&autoplay=1" : "";
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0${auto}`;
  const vimeo = props.src.match(/vimeo\.com\/(\d+)/);
  // transparent=0: the player paints its own black behind the picture
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1&transparent=0${auto}`;
  return props.src;
});
</script>

<template>
  <div class="video-embed">
    <!-- the poster and the play disc, until the first click -->
    <button
      v-if="!started"
      type="button"
      class="video-embed__poster"
      :aria-label="`Play ${title ?? 'the video'}`"
      @click="start"
    >
      <img :src="asset(poster!)" :alt="title ?? ''" loading="lazy" />
      <span class="play-mark" aria-hidden="true">
        <svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5z" /></svg>
      </span>
    </button>
    <iframe
      v-else
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
.video-embed__poster {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: #000;
  cursor: pointer;
}
.video-embed__poster img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain; /* a still that is not 16:9 keeps its edges, on black */
}
</style>
