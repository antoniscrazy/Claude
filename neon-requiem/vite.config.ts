import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // three.js und postprocessing in eigene, gut cachebare Chunks
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/postprocessing')) return 'postfx';
          return undefined;
        },
      },
    },
  },
});
