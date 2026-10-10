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
      // Gallery meetup photos are very large (multi-MB each); skip them to avoid Sharp/Vips OOM on Windows builds.
      exclude: /IMG_.*-Enhanced-NR/i,
      jpeg: { quality: 75, mozjpeg: true },
      jpg: { quality: 75, mozjpeg: true },
      png: { quality: 80 },
    }),
  ],
  base: './',
  server: {
    proxy: {
      '/cms.php': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
  assetsInclude: ['**/*.JPEG', '**/*.JPG'],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
