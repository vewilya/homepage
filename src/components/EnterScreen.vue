<script setup lang="ts">
defineEmits<{ enter: [] }>()
</script>

<template>
  <div class="enter-screen">
    <div class="enter-content">
      <h1>Urs Bollhalder</h1>
      <div class="subtitle">Audio Artist &amp; Developer</div>
      <div class="divider" />
      <button class="enter-btn" @click="$emit('enter')">Enter</button>
    </div>
  </div>
</template>

<style scoped>
.enter-screen {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 60px;
  background: var(--color-bg);
  transition: opacity 0.8s ease, visibility 0.8s;
}

.enter-content {
  text-align: center;
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
  margin: 0 auto 2.5rem;
  opacity: 0.5;
}

.enter-btn {
  background: none;
  border: 1px solid var(--color-accent-dim);
  border-radius: 2px;
  color: var(--color-text);
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 0.75rem 2.5rem;
  cursor: pointer;
  transition:
    border-color 0.3s,
    color 0.3s,
    background 0.3s;
}

.enter-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-glow);
}
</style>
