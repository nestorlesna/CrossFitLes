import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Configuración optimizada para mobile con Capacitor
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    // Optimizar chunks para mobile
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@capacitor-community/sqlite'],
  },
})
