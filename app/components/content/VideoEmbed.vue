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
  hush();
};

// The site's music must not play over a video, and comes back when the
// video pauses, ends or goes away, if it was the video that silenced it.
// The players say what they do over postMessage (YouTube with enablejsapi,
// Vimeo once asked), and a click into the iframe, seen as a window blur
// with the iframe active, hushes the music before the player even answers.
const frame = ref<HTMLIFrameElement>();
const { enabled: sound, toggle: toggleSound } = useAmbientAudio();
let hushed = false; // we switched the music off, so we may switch it back on
const hush = () => {
  if (!sound.value) return;
  hushed = true;
  void toggleSound();
};
const unhush = () => {
  if (!hushed || sound.value) return;
  hushed = false;
  void toggleSound();
};
const onBlur = () => {
  if (document.activeElement === frame.value) hush();
};
const isVimeo = computed(() => /vimeo\.com/.test(props.src));
const onMessage = (e: MessageEvent) => {
  if (!frame.value || e.source !== frame.value.contentWindow) return;
  let data: unknown = e.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return;
    }
  }
  if (!data || typeof data !== "object") return;
  const msg = data as { event?: string; info?: unknown; method?: string };
  if (isVimeo.value) {
    // Vimeo: after "ready", ask for the events we care about
    if (msg.event === "ready") {
      for (const value of ["play", "pause", "ended"])
        frame.value.contentWindow?.postMessage({ method: "addEventListener", value }, "*");
    } else if (msg.event === "play") hush();
    else if (msg.event === "pause" || msg.event === "ended") unhush();
  } else {
    // YouTube: state 1 is playing, 2 paused, 0 ended
    const state =
      msg.event === "onStateChange"
        ? (msg.info as number)
        : msg.event === "infoDelivery"
          ? (msg.info as { playerState?: number } | undefined)?.playerState
          : undefined;
    if (state === 1) hush();
    else if (state === 2 || state === 0) unhush();
  }
};
// YouTube only talks once the page has said it is listening
const listenToYouTube = () => {
  if (isVimeo.value || !frame.value?.contentWindow) return;
  frame.value.contentWindow.postMessage(
    JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
    "*",
  );
};
onMounted(() => {
  addEventListener("blur", onBlur);
  addEventListener("message", onMessage);
  if (props.autoplay) hush(); // starts on its own
});
watch(frame, (el) => el?.addEventListener("load", listenToYouTube));
onBeforeUnmount(() => {
  removeEventListener("blur", onBlur);
  removeEventListener("message", onMessage);
  unhush(); // the player is gone: the music may come back
});

// A player that a tap asked for must load at once: a lazy iframe out of view
// never loads, and a tap only counts for autoplay while it is fresh.
const eager = computed(() => props.autoplay || !!props.poster);

const player = computed(() => {
  const yt = props.src.match(/(?:v=|youtu\.be\/)([\w-]+)/);
  const auto = props.autoplay || props.poster ? "&autoplay=1" : "";
  // enablejsapi: the player reports play and pause over postMessage
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&enablejsapi=1${auto}`;
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
      :loading="eager ? 'eager' : 'lazy'"
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
