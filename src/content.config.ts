import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['*.md', '*.mdx'], base: 'src/data/post' }),
  schema: z.object({
    publishDate: z.date().optional(),
    updateDate: z.date().optional(),
    draft: z.boolean().optional(),

    title: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    /** Alternative text for the cover image. Leave empty for decorative stock photos. */
    imageAlt: z.string().optional(),

    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),

    metadata: metadataDefinition(),
  }),
});

// Pet ID tags: one file per pet under src/content/pets, named with the same
// 8-hex token engraved on the physical tag (e.g. a7k9x2m4.md -> tag A7K9-X2M4).
// Deliberately minimal: no address, surname or email fields — if the schema
// allowed them, someone would eventually fill them in on a public page.
const petsCollection = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/pets' }),
  schema: z.object({
    nombre: z.string(),
    raza: z.string(),
    foto: z.string(),
    tutor: z.string(),
    /** E.164 without the leading +, e.g. "593999999999". Used for wa.me and tel:. */
    whatsapp: z.string(),
    nota: z.string().optional(),
  }),
});

export const collections = {
  post: postCollection,
  pets: petsCollection,
};
