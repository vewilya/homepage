<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { isDark, toggle } = useTheme()

const links = [
  { label: 'Projects', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Sounds', href: '#sounds' },
  { label: 'Contact', href: '#contact' },
]
</script>

<template>
  <nav class="navbar">
    <a href="#" class="nav-logo">UB</a>
    <div class="nav-right">
      <div class="nav-links">
        <a v-for="link in links" :key="link.href" :href="link.href">{{ link.label }}</a>
      </div>
      <button class="nav-icon-btn" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggle">
        <svg v-if="isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--color-bg-glass);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-divider);
}

.nav-logo {
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--color-text);
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  transition: color 0.3s;
}

.nav-links a:hover {
  color: var(--color-accent);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-icon-btn {
  background: none;
  border: 1px solid var(--color-divider);
  border-radius: 4px;
  padding: 0.4rem;
  cursor: pointer;
  color: var(--color-text-muted);
  transition:
    color 0.3s,
    border-color 0.3s;
  display: flex;
  align-items: center;
}

.nav-icon-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent-dim);
}

.nav-icon-btn svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.8rem 1.2rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .nav-links a {
    font-size: 0.7rem;
  }
}
</style>
