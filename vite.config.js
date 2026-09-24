import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  // LIFI_API_KEY comes from .env.local in dev (never committed) and from Vercel env in production.
  const env = loadEnv(mode, root, '');
  return {
    root,
    plugins: [react()],
    server: {
      port: 8765,
      // Mirror of api/lifi.js for local dev.
      proxy: {
        '/api/lifi': {
          target: 'https://li.quest',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/lifi/, ''),
          headers: env.LIFI_API_KEY ? { 'x-lifi-api-key': env.LIFI_API_KEY } : {},
        },
      },
    },
    build: { chunkSizeWarningLimit: 5000 },
  };
});
