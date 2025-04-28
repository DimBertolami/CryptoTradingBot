import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/trading': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/trading_data': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
});
