import { env, getEnv } from '@extension/env'
import { watchI18nPlugin, watchRebuildPlugin } from '@extension/hmr'
import react from '@vitejs/plugin-react-swc'
import deepmerge from 'deepmerge'
import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'

const ENV = getEnv()

export const watchOption = ENV['IS_DEV']
  ? {
      chokidar: {
        awaitWriteFinish: true,
      },
    }
  : undefined

export const withPageConfig = (config: UserConfig) => {
  return defineConfig(
    deepmerge(
      {
        define: {
          'process.env': env,
        },
        base: '',
        plugins: [
          react(),
          ENV['IS_DEV'] && watchRebuildPlugin({ refresh: true }),
          ENV['IS_DEV'] && watchI18nPlugin(),
        ],
        build: {
          sourcemap: ENV['IS_DEV'] || ENV['ENABLE_SOURCEMAPS'],
          minify: ENV['IS_PROD'] && !ENV['ENABLE_SOURCEMAPS'],
          reportCompressedSize: ENV['IS_PROD'],
          emptyOutDir: ENV['IS_PROD'],
          watch: watchOption,
          rollupOptions: {
            external: ['chrome'],
          },
        },
      },
      config,
    ),
  )
}
