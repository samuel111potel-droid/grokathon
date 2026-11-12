import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

function geojsonAsJson() {
  return {
    name: 'geojson-as-json',
    transform(code: string, id: string) {
      if (id.split('?')[0].endsWith('.geojson')) {
        return { code: `export default ${code}`, map: null };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), geojsonAsJson()],
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
