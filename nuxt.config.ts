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
    "~/assets/css/main.css",
  ],
  app: {
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
