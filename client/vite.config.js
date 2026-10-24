import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React + React DOM in their own chunk
          'vendor-react': ['react', 'react-dom'],
          // React Router
          'vendor-router': ['react-router-dom'],
          // Charts library — heaviest dep, only loaded in admin
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
});
