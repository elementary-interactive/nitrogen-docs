import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Required by Starlight on Astro 5+/6+ — without this declaration the
// `docs` content collection doesn't exist and every sidebar entry that
// references a slug under `src/content/docs/**` fails to resolve at
// build time.
export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() })
};
