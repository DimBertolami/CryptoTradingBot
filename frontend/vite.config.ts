import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      overlay: false
    },
    strictPort: true,
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: '/opt/lampp/htdocs/frontend/index.html'
      }
    }
  },
  publicDir: 'public',
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', '@tanstack/react-query']
  }
});
