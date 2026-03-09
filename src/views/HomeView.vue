<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'
import AuroraBackground from '../components/AuroraBackground.vue'
import EnterScreen from '../components/EnterScreen.vue'
import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import ProjectsSection from '../components/ProjectsSection.vue'
import AboutSection from '../components/AboutSection.vue'
import SoundsSection from '../components/SoundsSection.vue'
import ContactSection from '../components/ContactSection.vue'

const entered = ref(false)
useTheme()

function handleEnter() {
  entered.value = true
}
</script>

<template>
  <AuroraBackground />
  <Transition name="fade">
    <EnterScreen v-if="!entered" @enter="handleEnter" />
  </Transition>
  <NavBar v-if="entered" />
  <main>
    <HeroSection />
    <template v-if="entered">
      <ProjectsSection />
      <AboutSection />
      <SoundsSection />
      <ContactSection />
    </template>
  </main>
</template>

<style scoped>
main {
  padding-top: 60px;
}
</style>

<style>
.fade-leave-active {
  transition: opacity 1.4s ease;
}

.fade-leave-to {
  opacity: 0;
}
</style>
