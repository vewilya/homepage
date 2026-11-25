<script setup lang="ts">
/**
 * The light/dark switch: an instrument-panel rocker with a sun that slides
 * across to become a moon. DAY and NIGHT are printed either side.
 *
 * The knob position is driven by the stylesheet's --layer-dark variable, not
 * by state, so the prerendered page already shows the right side before any
 * JavaScript runs. Only the aria state waits for hydration.
 *
 * `size`: "large" for the home screen, where the switch lives; "small" is
 * kept for a compact variant should one be needed again.
 */
withDefaults(defineProps<{ size?: "large" | "small" }>(), { size: "large" });

const { theme, toggle } = useTheme();
</script>

<template>
  <button
    type="button"
    class="mode-switch"
    :class="`mode-switch--${size}`"
    role="switch"
    :aria-checked="theme === 'dark'"
    aria-label="Night mode"
    @click="toggle"
  >
    <span class="mode-switch__label">day</span>
    <span class="mode-switch__track" aria-hidden="true">
      <span class="mode-switch__ticks" />
      <span class="mode-switch__knob" />
    </span>
    <span class="mode-switch__label">night</span>
  </button>
</template>
