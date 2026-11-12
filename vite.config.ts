import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { grokProxy } from './vite.grok';

// Lane 5: static demo bundle; all data is local JSON under /data.
// grokProxy adds POST /api/grok to the dev server only (live Grok on the host laptop; key stays in .env).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), grokProxy(loadEnv(mode, process.cwd(), ''))],
  server: { port: 5173, host: true },
  build: { chunkSizeWarningLimit: 4000 },
}));
