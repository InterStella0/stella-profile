import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend (FastAPI) for /api, /admin and /uploads during `npm run dev`.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiTarget,
      '/admin': apiTarget,
      '/uploads': apiTarget,
    },
  },
});
