import { ref, watchEffect } from 'vue'

const isDark = ref(true)
let manualOverride = false
let initialized = false

const mql = window.matchMedia('(prefers-color-scheme: dark)')

function applySystemPreference() {
  if (!manualOverride) {
    isDark.value = mql.matches
  }
}

function init() {
  if (initialized) return
  initialized = true

  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
    manualOverride = true
  } else {
    isDark.value = mql.matches
  }

  mql.addEventListener('change', () => {
    applySystemPreference()
  })
}

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  if (manualOverride) {
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }
})

export function useTheme() {
  init()

  function toggle() {
    manualOverride = true
    isDark.value = !isDark.value
  }

  function resetToSystem() {
    manualOverride = false
    localStorage.removeItem('theme')
    isDark.value = mql.matches
  }

  return { isDark, toggle, resetToSystem }
}
