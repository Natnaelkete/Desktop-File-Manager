import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src/renderer'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
          },
        },
      },
      {
        entry: 'src/preload/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
          },
        },
      },
    ]),
    renderer(),
  ],
})
