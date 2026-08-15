import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/patient': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/medicine': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/interaction-flag': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/symptom': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/connection': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/caregiver': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
