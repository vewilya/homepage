<script setup lang="ts">
import { getRandomProjects } from '../data/showcaseProjects'

const projects = getRandomProjects(3)

function youtubeThumb(url: string): string | null {
  const match = url.match(/youtube\.com\/embed\/([^?&]+)/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null
}

function vimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/video\/(\d+)/)
  return match ? match[1] : null
}
</script>

<template>
  <section id="projects">
    <h2>Projects</h2>
    <div class="grid">
      <a v-for="project in projects" :key="project.title" :href="project.link" target="_blank" class="card">
        <div v-if="project.image" class="card-preview">
          <img :src="project.image" :alt="project.title" />
        </div>
        <div v-else-if="project.video && youtubeThumb(project.video)" class="card-preview">
          <img :src="youtubeThumb(project.video)!" :alt="project.title" />
          <span class="preview-play">&#9654;</span>
        </div>
        <div v-else-if="project.video && vimeoId(project.video)" class="card-preview card-preview-video">
          <iframe :src="`https://player.vimeo.com/video/${vimeoId(project.video)}?background=1&muted=1`" frameborder="0" />
        </div>
        <h3>{{ project.title }}</h3>
        <p>{{ project.description }}</p>
        <div class="card-footer">
          <div class="tags">
            <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
          </div>
          <div class="card-links">
            <a v-if="project.github" :href="project.github" target="_blank" @click.stop>GitHub</a>
            <a v-if="project.video" :href="project.video" target="_blank" @click.stop>Video</a>
          </div>
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.card {
  display: block;
  padding: 1.5rem;
  border: 1px solid var(--color-accent-dim);
  border-radius: 4px;
  background: var(--color-card-bg);
  transition:
    border-color 0.3s,
    background 0.3s;
  color: inherit;
}

.card:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-glow);
}

.card-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 1rem;
  background: var(--color-bg-mute);
}

.card-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-preview-video iframe {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.preview-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

h3 {
  font-size: 1.1rem;
  font-weight: 400;
  margin-bottom: 0.6rem;
  color: var(--color-text);
}

p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tags span {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--color-divider);
  border-radius: 2px;
  color: var(--color-text-dim);
}

.card-links {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.card-links a {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-accent);
  transition: color 0.3s;
}

.card-links a:hover {
  color: var(--color-accent-hover);
}
</style>
