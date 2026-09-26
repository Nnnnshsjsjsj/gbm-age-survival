import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app is the site root on GitHub Pages: https://nnnnshsjsjsj.github.io/gbm-age-survival/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
