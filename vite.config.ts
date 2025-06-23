import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://n8n.creativetechnologists.nl/webhook',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, ''),
        secure: true,
      },
      '/api/webhook-test': {
        target: 'https://n8n.creativetechnologists.nl/webhook-test',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webhook-test/, ''),
        secure: true,
      }
    }
  }
});