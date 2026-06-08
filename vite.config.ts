import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['ramda', '@mjcdev/react-body-highlighter'],
    holdUntilCrawlEnd: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('@supabase/supabase-js')) return 'supabase'
          if (id.includes('@mjcdev/react-body-highlighter')) return 'body-map'
          if (id.includes('@tanstack/react-query')) return 'query'
        },
      },
    },
  },
})
