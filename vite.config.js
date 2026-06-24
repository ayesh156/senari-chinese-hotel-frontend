import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor';
          if (id.includes('node_modules/react-router')) return 'vendor';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/zustand')) return 'state';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'animations';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'charts';
        },
      },
    },
  },
})