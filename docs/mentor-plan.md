# Mentor plan: ursbollhalder.com on Nuxt

## Goal

Rebuild the homepage as a Nuxt 4 static site with Nuxt Content, same setup
as susanneabbuehl (pnpm, @nuxt/content, GitHub Pages workflow), but a new,
minimal look. Posts are plain markdown files in `content/thoughts/`.

Reference project: `/Users/ursbollhalder/Dev/susanneabbuehl`

## Pages

- `/` — one simple screen:
  - urs bollhalder
  - "Into Sound and Space: Crafting silence, designing the wave, and shaping
    the spaces where it unfolds"
  - Creative Technologist | Artist | Developer
  - links: GitHub, LinkedIn (X later)
- `/thoughts` — the blog: all posts, newest first
- `/thoughts/<slug>` — one post, rendered from markdown
- `/projects` — exists, not linked from the nav yet, shows nothing for now

## Two modes

Light and dark, each with its own visuals and music. The visitor's system
preference picks the start, a toggle in the header overrides it, the choice
is remembered. Sound is off until the visitor switches it on (browsers block
autoplay without a gesture; no enter screen, people land on posts from search).

Assets (encoded copies in `public/`, masters in the gitignored `images/`
and `audio/` folders):

- Pictures, one per page kind and mode, crossfaded on a switch:
  - home: dark `twin-moons`, light `retro-astronaut`
  - thoughts index: dark `rocket-snowy-peaks`, light `retro-rocket`
  - posts and other pages: dark `galactic-mountains`, light `starlit-planets`
- Dark track: `audio/pitch-black.m4a`, loops; fades to silence at both ends,
  so a first start lands somewhere in the middle, never at the head
- Light track: `audio/city-sundown-intro.m4a` once (first play), then
  `audio/city-sundown-loop.m4a` looping seamlessly
- A mode switch crossfades both tracks over 5s (equal power); tracks resume
  where they were paused. Pictures, veil and colours fade over 4s.

- Dark: dark sky with clouds, nebula, lightning; pointer particles over the UI.
- Light: sunny, flowers, butterflies, shooting stars.

Animation brief (Urs, 25 Nov 2026): two parts.

1. Ambient, always on, subtle, in random places: fine-grained noise laid out
   on a dot grid, like film grain snapped to a lattice.
2. Reactive: follows the mouse pointer.

Build order: the canvas loop and the ambient dot-grid noise first, then the
pointer part, then anything mode-specific. Every effect is a small pure
drawing function `(ctx, time, pointer) => void`; one canvas loop calls the
list for the current mode. `prefers-reduced-motion` stops the loop.

## Modules

- `content.config.ts` — two collections: `thoughts` (content/thoughts/*.md,
  with `date`, optional `tags`, `draft`) and `pages` (everything else, e.g.
  a later `projects.md`).
- `app/composables/useTheme.ts` — `"light" | "dark"`, sets `data-theme` on
  `<html>`, persisted in localStorage.
- `app/components/SkyCanvas.vue` — full-screen canvas behind the page,
  `pointer-events: none`, `<ClientOnly>`, owns the loop and pointer position.
- `app/utils/sky/*.ts` — one file per effect, no Vue inside.
- `app/composables/useAmbientAudio.ts` — one `Audio`, track per theme,
  fade in/out, on/off persisted.
- `app/layouts/default.vue` — header (name + nav: Thoughts), main slot,
  footer (GitHub, LinkedIn).
- `app/pages/index.vue` — the one screen above.
- `app/pages/thoughts/index.vue` — list of posts.
- `app/pages/thoughts/[slug].vue` — one post via `ContentRenderer`.
- `app/pages/projects.vue` — placeholder, not in the nav.
- `app/components/PostList.vue` — "date — title" rows.
- `app/assets/css/main.css` — CSS variables, fonts, prose styles.
- `.github/workflows/deploy.yml` — copy of Susanne's, branch `master`,
  `CNAME` in `public/`.

## Done when

`pnpm dev` shows home, thoughts list and one post.
`pnpm exec nuxt build --preset github_pages` produces `.output/public`
with `CNAME` inside. Push to `master` deploys.

## Assignments

- [x] 1. Scaffold: Nuxt 4 + @nuxt/content installed, `pnpm dev` serves a page
- [x] 2. Collections: `content.config.ts` + one post in `content/thoughts/` (Claude)
- [x] 3. Layout: `default.vue` with header, nav, footer; `app.vue` uses it
- [x] 4. Home page: name, tagline, roles, links
- [x] 5. Thoughts index: query posts, render a plain `<ul>`
- [x] 6. Post page: `[slug].vue` with `ContentRenderer`, 404 on miss
- [x] 7. `PostList` component; `projects.vue` placeholder
- [x] 8. Styling: `main.css` with variables for both themes, fonts, prose
- [x] 9. Deploy: workflow, `public/CNAME`, drop old `index.html`, move audio
- [x] 10. `useTheme` + `ModeSwitch` (large in the hero, small in the header);
      sets `data-theme`, CSS, pictures and music follow with a 2.5s crossfade (Claude)
- [x] 11. `SkyCanvas` with the loop, resize, reduced-motion, pointer tracking;
      first effect: ambient dot-grid noise (`utils/sky/dotGrid.ts`) (Claude)
- [ ] 12. Pointer-reactive effect
- [x] 13. Mode-specific effects (Urs, 25 Nov 2026): dark keeps the grid
      pulse — mathematics, geometry. Light gets butterflies — subtle but a bit
      erratic, creativity and free-flowing ideas (`utils/sky/butterflies.ts`,
      they also shy away from the pointer) (Claude)
- [x] 14. `useAmbientAudio` + sound toggle, one track per theme, crossfade (Claude)
- [ ] 15. More effects, one at a time: clouds, lightning, butterflies, flowers
