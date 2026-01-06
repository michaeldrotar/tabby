import { resolve } from 'node:path'
import { BUILD_OUT_DIR } from '@extension/env/const'
import { withPageConfig } from '@extension/vite-config/with-page-config'

const rootDir = resolve(import.meta.dirname)
const srcDir = resolve(rootDir, 'src')

export default withPageConfig({
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', BUILD_OUT_DIR, 'omnibar-popup'),
  },
})
