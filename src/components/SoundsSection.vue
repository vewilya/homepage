<template>
  <section id="sounds">
    <h2>Sounds</h2>
    <div class="sc-embed">
      <iframe
        width="100%"
        height="450"
        scrolling="no"
        frameborder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/urs-bollhalder/sets/2022a1&color=%237eb8c9&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"
      />
    </div>
  </section>
</template>

<style scoped>
.sc-embed {
  border: 1px solid var(--color-accent-dim);
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-card-bg);
}

.sc-embed iframe {
  display: block;
}
</style>
