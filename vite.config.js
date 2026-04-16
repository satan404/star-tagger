import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/astrometry': {
        target: 'http://nova.astrometry.net/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/astrometry/, '')
      }
    }
  }
})
