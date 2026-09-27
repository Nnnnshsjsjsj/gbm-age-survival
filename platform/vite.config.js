import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app is the site root on GitHub Pages: https://nnnnshsjsjsj.github.io/gbm-age-survival/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    // the lazy 3D chunk (three + react-three-fiber) is large by nature; the main chunk stays well under 400 kB
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['gsap', 'gsap/ScrollTrigger', 'lenis'],
        },
      },
    },
  },
});
