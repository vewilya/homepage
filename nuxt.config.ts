// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/content"],
  devtools: { enabled: true },
  compatibilityDate: "2024-04-03",
  css: [
    "@fontsource/inter/300.css",
    "@fontsource/inter/400.css",
    "@fontsource/inter/500.css",
    "@fontsource/jetbrains-mono/400.css",
    "@fontsource/space-grotesk/300.css",
    "@fontsource/space-grotesk/500.css",
    "@fontsource/space-grotesk/700.css",
    "~/assets/css/main.css",
  ],
  app: {
    pageTransition: { name: "page" }, // no mode: old and new page overlap and crossfade
    head: {
      htmlAttrs: { lang: "en" },
      title: "urs bollhalder",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Into sound and space: crafting silence, designing the wave, and shaping the spaces where it unfolds.",
        },
        { name: "color-scheme", content: "dark light" },
      ],
      script: [
        {
          // Runs before the first paint: re-applies a stored mode choice so a
          // reload never flashes the other mode, unless the OS preference has
          // changed since the choice, in which case the choice is dropped and
          // the OS wins (same rule as useTheme). Must stay dependency-free.
          innerHTML:
            "try{var t=localStorage.getItem('ub:theme'),o=localStorage.getItem('ub:theme-os'),n=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(o&&o!==n){localStorage.removeItem('ub:theme');localStorage.removeItem('ub:theme-os')}else if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
        },
      ],
    },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          // One code theme per colour scheme; main.css switches between them.
          theme: { default: "github-dark", light: "github-light" },
          langs: [
            "js",
            "ts",
            "vue",
            "html",
            "css",
            "json",
            "bash",
            "rust",
            "cpp",
            "c",
            "python",
            "md",
            "yaml",
          ],
        },
      },
    },
  },
});
