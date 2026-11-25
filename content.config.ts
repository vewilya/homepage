import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    // Blog posts: one markdown file per post in content/thoughts/.
    // The file name is the URL: thoughts/hello.md -> /thoughts/hello
    thoughts: defineCollection({
      type: "page",
      source: "thoughts/*.md",
      schema: z.object({
        date: z.string(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional(),
      }),
    }),
    // Plain pages: index.md, about.md, a later projects.md ...
    pages: defineCollection({
      type: "page",
      source: { include: "**", exclude: ["thoughts/**"] },
    }),
  },
});
