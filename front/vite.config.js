import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vendor': resolve(__dirname, '../vendor')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/shed-formatter-bundle.js'),
      name: 'ShedFormatter',
      fileName: 'shed-formatter',
      formats: ['umd']
    },
    rollupOptions: {
      external: [], // Bundle everything
      output: {
        globals: {}
      }
    }
  }
})
