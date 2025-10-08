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
    // Build mode can be switched based on environment
    ...(process.env.BUILD_MODE === 'lib' ? {
      // Library mode - for bundling shed-formatter only
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
    } : {
      // App mode - for building the demo site
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          demo: resolve(__dirname, 'demo-python-linting.html')
        },
        output: {
          // Copy pyodide and wasm files to dist
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.wasm')) {
              return 'assets/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      // Don't externalize pyodide - let Vite handle it
      commonjsOptions: {
        include: [/node_modules/]
      }
    })
  }
})
