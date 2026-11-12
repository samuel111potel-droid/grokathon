import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, 'data'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      allow: ['.'],
    },
  },
  optimizeDeps: {
    include: [
      'maplibre-gl',
      '@deck.gl/core',
      '@deck.gl/layers',
      '@deck.gl/mapbox',
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
