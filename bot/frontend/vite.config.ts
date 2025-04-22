import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/trading/paper': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/trading_data': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false
      },
      '/backtest': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      },
      '/ml': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  },
});
