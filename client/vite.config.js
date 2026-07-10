import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        // AI quiz generation can take 30–60s; default proxy timeout is too short
        timeout: 120000,
        proxyTimeout: 120000,
      },
    },
  },
});
