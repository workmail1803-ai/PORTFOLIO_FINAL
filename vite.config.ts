import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Canonical and Open Graph tags need absolute URLs, but the domain is only
 * known at deploy time. Vercel exposes the production domain during the build,
 * so stamp it in rather than hard-coding one that will drift.
 */
function stampSiteUrl(): Plugin {
  const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const raw =
    process.env.VITE_SITE_URL ||
    (fromVercel ? `https://${fromVercel}` : '') ||
    'https://nafismomen.com';
  const url = raw.replace(/\/+$/, '');

  return {
    name: 'stamp-site-url',
    transformIndexHtml(html) {
      return html.split('__SITE_URL__').join(url);
    },
  };
}

export default defineConfig({
  plugins: [react(), stampSiteUrl()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
