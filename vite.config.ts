import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Lane 5: static demo bundle. No backend; all data is local JSON under /data.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
  build: { chunkSizeWarningLimit: 4000 },
});
