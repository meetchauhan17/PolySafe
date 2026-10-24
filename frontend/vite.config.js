import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Helper for API proxy routes: bypass HTML navigation requests so React Router handles them
const createApiProxy = (target = 'http://localhost:5000') => ({
  target,
  changeOrigin: true,
  bypass(req) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return '/index.html';
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'framer-motion', 'lucide-react', 'axios'],
  },
  server: {
    port: 3000,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    proxy: {
      '/api': createApiProxy(),
      '/analytics': createApiProxy(),
      '/auth': createApiProxy(),
      '/patient': createApiProxy(),
      '/medicine': createApiProxy(),
      '/interaction-flag': createApiProxy(),
      '^/symptom(/|\\?|$)': createApiProxy(),
      '/connection': createApiProxy(),
      '^/caregiver(/|\\?|$)': createApiProxy(),
      '/health': createApiProxy(),
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
