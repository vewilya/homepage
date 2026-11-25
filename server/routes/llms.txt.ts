/**
 * /llms.txt: a plain-text index of the site for language models, in the
 * shape proposed at llmstxt.org. Built from the content collections at
 * build time (the route is prerendered), so a new post or project is in it
 * without anyone editing a file.
 */
import { queryCollection } from "@nuxt/content/server";

const SITE = "https://www.ursbollhalder.com";

export default defineEventHandler(async (event) => {
  const [posts, projects] = await Promise.all([
    queryCollection(event, "thoughts")
      .order("date", "DESC")
      .select("path", "title", "description", "date", "draft")
      .all(),
    queryCollection(event, "projects")
      .where("active", "=", true)
      .order("order", "ASC")
      .select("path", "title", "description", "year", "link", "stem")
      .all(),
  ]);

  const day = (d: string) => String(d).slice(0, 10);
  const lines = [
    "# urs bollhalder",
    "",
    "> Into Sound and Space: crafting silence, designing the wave, and shaping the spaces where it unfolds.",
    "",
    "Urs Bollhalder is a creative technologist, artist and developer in Lucerne, Switzerland: a composer and sound artist who also builds the software and hardware his work runs on (audio DSP, plugins, generative music, web applications). This site has two modes, light and dark, each with its own pictures and ambient music by him.",
    "",
    "## Transmissions (blog)",
    "",
    ...posts
      .filter((p) => !p.draft)
      .map((p) => `- [${p.title}](${SITE}${p.path}) (${day(p.date)}): ${p.description}`),
    "",
    "## Expeditions (projects)",
    "",
    ...projects.map(
      (p) =>
        `- [${p.title}](${SITE}/expeditions)${p.year ? ` (${p.year})` : ""}: ${p.description}${p.link ? ` See ${p.link}` : ""}`,
    ),
    "",
    "## Elsewhere",
    "",
    "- [GitHub](https://github.com/vewilya)",
    "- [LinkedIn](https://linkedin.com/in/ursbollhaldercomposer)",
    "",
  ];

  setHeader(event, "content-type", "text/plain; charset=utf-8");
  return lines.join("\n");
});
