import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      logStats: true,
      // Gallery photos are already resized and compressed by `npm run photos`.
      exclude: /IMG_.*-Enhanced-NR/i,
      jpeg: { quality: 75, mozjpeg: true },
      jpg: { quality: 75, mozjpeg: true },
      png: { quality: 80 },
    }),
  ],
  base: './',
  assetsInclude: ['**/*.JPEG', '**/*.JPG'],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
