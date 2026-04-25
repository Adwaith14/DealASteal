import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // The ``server-only`` marker throws when imported from anything but a
      // React Server Component bundle. Vitest runs in jsdom so the throw is
      // unwanted noise — alias it to an empty module for tests.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
