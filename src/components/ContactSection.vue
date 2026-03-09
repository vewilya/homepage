<template>
  <section id="contact">
    <h2>Contact</h2>
    <p class="intro">Interested in working together? Get in touch.</p>
    <div class="links">
      <a href="https://linkedin.com/in/ursbollhaldercomposer" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24">
          <path
            d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.26 2.37 4.26 5.44v6.3zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
          />
        </svg>
        LinkedIn
      </a>
      <a href="https://github.com/vewilya" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24">
          <path
            d="M12 .3C5.37.3 0 5.67 0 12.3c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.75-1.33-1.75-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.57 22.1 24 17.6 24 12.3 24 5.67 18.63.3 12 .3z"
          />
        </svg>
        GitHub
      </a>
    </div>
    <div class="footer">&copy; {{ new Date().getFullYear() }} Urs Bollhalder</div>
  </section>
</template>

<style scoped>
#contact {
  text-align: center;
  padding-bottom: 4rem;
}

.intro {
  font-size: 1rem;
  color: var(--color-text-muted);
  font-weight: 300;
  margin-bottom: 2rem;
}

.links {
  display: flex;
  gap: 1.2rem;
  justify-content: center;
  margin-bottom: 3.5rem;
}

.links a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.65rem 1.4rem;
  border: 1px solid var(--color-accent-dim);
  border-radius: 2px;
  transition:
    border-color 0.3s,
    color 0.3s,
    background 0.3s;
}

.links a:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: var(--color-accent-glow);
}

.links a svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
  flex-shrink: 0;
}

.footer {
  font-size: 0.7rem;
  color: var(--color-footer);
  letter-spacing: 0.1em;
}
</style>
