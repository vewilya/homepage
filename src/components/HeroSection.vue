<template>
  <section class="hero">
    <h1>Urs Bollhalder</h1>
    <div class="subtitle">Audio Artist &amp; Developer</div>
    <div class="divider" />
    <p class="tagline">
      Crafting sound and code — building experiences<br />
      at the intersection of music and technology.
    </p>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  border-top: none !important;
}

h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--color-text-heading);
  margin-bottom: 0.4rem;
}

.subtitle {
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 2.5rem;
}

.divider {
  width: 48px;
  height: 1px;
  background: var(--color-accent);
  margin-bottom: 2.5rem;
  opacity: 0.5;
}

.tagline {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--color-text-muted);
  font-weight: 300;
}
</style>
