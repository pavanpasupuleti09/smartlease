import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Spring Boot backend has no CORS configuration, so in development we
// proxy /api to the backend to keep the frontend same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
