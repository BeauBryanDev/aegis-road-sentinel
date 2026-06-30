import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Backend FastAPI (see CLAUDE.md). Lets the SPA call /api/* in dev
      // without CORS friction; override with VITE_API_BASE_URL for direct calls.
      '/api': {
        //target: 'http://localhost:8000',
        target:  'http://192.168.1.53:8000',
        changeOrigin: true,
        ws: true, // proxy the live-stream WebSocket (/api/stream/ws) too
      },
    },
  },
})
