import { resolve } from 'node:path'
import { defineConfig, type PluginOption } from 'vite'
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets'
import makeManifestPlugin from './utils/plugins/make-manifest-plugin.js'
import { watchPublicPlugin, watchRebuildPlugin } from '@extension/hmr'
import { watchOption } from '@extension/vite-config'
import env, { IS_DEV, IS_PROD } from '@extension/env'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const rootDir = resolve(import.meta.dirname)
const srcDir = resolve(rootDir, 'src')

const outDir = resolve(rootDir, '..', 'dist')
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
    IS_DEV && watchRebuildPlugin({ reload: true, id: 'chrome-extension-hmr' }),
    nodePolyfills(),
  ],
  publicDir: resolve(rootDir, 'public'),
  build: {
    lib: {
      name: 'ExtensionScripts',
      fileName: 'scripts',
      formats: ['es'],
      entry: resolve(srcDir, 'background', 'index.ts'), // Ignored by rollupOptions.input
    },
    outDir,
    emptyOutDir: false,
    sourcemap: IS_DEV,
    minify: IS_PROD,
    reportCompressedSize: IS_PROD,
    watch: watchOption,
    rollupOptions: {
      input: {
        background: resolve(srcDir, 'background', 'index.ts'),
        content: resolve(srcDir, 'content', 'index.tsx'),
        omnibar: resolve(srcDir, 'omnibar', 'index.html'),
        options: resolve(srcDir, 'options', 'index.html'),
        sidePanel: resolve(srcDir, 'side-panel', 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
      external: ['chrome'],
    },
  },
})
