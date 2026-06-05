import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    datetime: z.string(),
    readTime: z.string(),
    font: z.enum(['garamond', 'newsreader']),
    category: z.enum(['professional', 'personal']),
    featured: z.boolean().optional(),
  }),
});

export const collections = { blog };
