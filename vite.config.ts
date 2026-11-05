import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

/**
 * GitHub Pages serves project sites from `/<repo>/`, so the base path cannot be
 * hard-coded. `BASE_PATH` is set by the deploy workflow and stays `/` locally.
 */
const basePath = (() => {
  const raw = process.env.BASE_PATH?.trim() ?? '';
  if (raw === '' || raw === '/') return '/';
  return `/${raw.replace(/^\/+|\/+$/g, '')}/`;
})();

export default defineConfig({
  base: basePath,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Neuro Resident Companion',
        short_name: 'NRC',
        description:
          'Offline-first decision-support companion for the neurology resident. Not a substitute for clinical judgement.',
        lang: 'ar',
        dir: 'rtl',
        // Relative URLs resolve against the manifest location, so the same
        // manifest works at `/` and at `/<repo>/` (GitHub Pages project site).
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f766e',
        background_color: '#f4f7fa',
        categories: ['medical', 'education', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
