import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@ai': path.resolve(__dirname, './src/ai'),
      '@world': path.resolve(__dirname, './src/world'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@shaders': path.resolve(__dirname, './src/shaders'),
    },
  },
  server: {
    port: 4200,
    open: true,
  },
  build: {
    sourcemap: true,
  },
})
