import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// SITE_URL is configured at deploy time (Vercel). Falls back to a placeholder so
// the build never claims a domain that does not exist yet.
export default defineConfig({
  site: process.env.SITE_URL || 'https://atlas-of-middle-earth.example',
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/404') })],
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: {
    build: { chunkSizeWarningLimit: 1200 },
  },
});
