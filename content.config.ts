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
        location: z.string().optional(), // where it was written, e.g. "Luzern"
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional(),
      }),
    }),
    // Projects, one file each in content/projects/. Shown on /expeditions
    // only while `active` is true; `order` sorts them, lowest first.
    projects: defineCollection({
      type: "page",
      source: "projects/*.md",
      schema: z.object({
        active: z.boolean(),
        order: z.number(),
        year: z.number().optional(),
        tags: z.array(z.string()).optional(),
        link: z.string().optional(), // outside page; a project may have only a post
        post: z.string().optional(), // path of the transmission about it, e.g. /thoughts/x
        image: z.string().optional(), // path under /public
        video: z.string().optional(),
        github: z.string().optional(),
      }),
    }),
    // Plain pages: index.md, about.md ...
    pages: defineCollection({
      type: "page",
      source: { include: "**", exclude: ["thoughts/**", "projects/**"] },
    }),
  },
});
