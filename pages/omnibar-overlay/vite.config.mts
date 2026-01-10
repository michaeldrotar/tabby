import { resolve } from 'node:path'
import { getEnv } from '@extension/env/getEnv'
import { withPageConfig } from '@extension/vite-config/with-page-config'

const ENV = getEnv()

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
    outDir: resolve(
      rootDir,
      '..',
      '..',
      ENV['BUILD_OUT_DIR'],
      'omnibar-overlay',
    ),
  },
})
