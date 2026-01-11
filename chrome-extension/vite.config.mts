import { resolve } from 'node:path'
import { env } from '@extension/env/config'
import { getEnv } from '@extension/env/getEnv'
import { watchPublicPlugin } from '@extension/hmr/plugins/watch-public-plugin'
import { watchRebuildPlugin } from '@extension/hmr/plugins/watch-rebuild-plugin'
import { watchOption } from '@extension/vite-config/with-page-config'
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets'
import { defineConfig } from 'vite'
import makeManifestPlugin from './utils/plugins/make-manifest-plugin.js'
import type { PluginOption } from 'vite'

const ENV = getEnv()

const rootDir = resolve(import.meta.dirname)
const srcDir = resolve(rootDir, 'src')

const outDir = resolve(rootDir, '..', ENV['BUILD_OUT_DIR'])

export default defineConfig({
  define: {
    'process.env': env,
  },
  resolve: {
    alias: {
      '@root': rootDir,
      '@src': srcDir,
      '@assets': resolve(srcDir, 'assets'),
    },
  },
  plugins: [
    libAssetsPlugin({
      outputPath: outDir,
    }) as PluginOption,
    watchPublicPlugin(),
    makeManifestPlugin({ outDir }),
    ENV['IS_DEV'] &&
      watchRebuildPlugin({ reload: true, id: 'chrome-extension-hmr' }),
  ],
  publicDir: resolve(rootDir, 'public'),
  build: {
    lib: {
      name: 'BackgroundScript',
      fileName: 'background',
      formats: ['es'],
      entry: resolve(srcDir, 'background', 'index.ts'),
    },
    outDir,
    emptyOutDir: false,
    sourcemap: ENV['IS_DEV'],
    minify: ENV['IS_PROD'],
    reportCompressedSize: ENV['IS_PROD'],
    watch: watchOption,
    rollupOptions: {
      external: ['chrome'],
    },
  },
})
