import { resolve } from 'node:path'
import { getEnv } from '@extension/env/getEnv'
import { withPageConfig } from '@extension/vite-config/with-page-config'

const ENV = getEnv()

const rootDir = resolve(import.meta.dirname)
const srcDir = resolve(rootDir, 'src')

export default withPageConfig({
  define: {
    __TABBY_ARCHITECTURE_PROOF__:
      process.env['CLI_CEB_ARCHITECTURE_PROOF'] === 'true',
  },
  resolve: {
    alias: {
      '@src': srcDir,
    },
  },
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, '..', '..', ENV['BUILD_OUT_DIR'], 'tab-manager'),
  },
})
