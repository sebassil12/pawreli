import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

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
  pets: petsCollection,
};
