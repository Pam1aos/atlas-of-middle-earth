import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Every page is prerendered; only /api/ask runs on demand (prerender = false),
// which is what lets the assistant call a model with a server-side key.
export default defineConfig({
  site: process.env.SITE_URL || 'https://atlas-of-middle-earth.vercel.app',
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/404') })],
  adapter: vercel({ imageService: false }),
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    build: { chunkSizeWarningLimit: 1200 },
  },
});
