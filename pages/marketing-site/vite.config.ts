import { resolve } from 'node:path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const siteRoot = import.meta.dirname
const workspaceRoot = resolve(siteRoot, '../..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@extension/ui/base.css',
        replacement: resolve(workspaceRoot, 'packages/ui/base.css'),
      },
      {
        find: '@extension/ui',
        replacement: resolve(workspaceRoot, 'packages/ui/lib'),
      },
      {
        find: '@extension/shared',
        replacement: resolve(workspaceRoot, 'packages/shared/lib'),
      },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(siteRoot, 'index.html'),
        productPreview: resolve(siteRoot, 'product-preview.html'),
      },
    },
  },
})
