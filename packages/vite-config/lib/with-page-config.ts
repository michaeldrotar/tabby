import { env } from '@extension/env/config'
import { ENABLE_SOURCEMAPS, IS_DEV, IS_PROD } from '@extension/env/const'
import { watchI18nPlugin } from '@extension/hmr/watch-i18n-plugin'
import { watchRebuildPlugin } from '@extension/hmr/watch-rebuild-plugin'
import react from '@vitejs/plugin-react-swc'
import deepmerge from 'deepmerge'
import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'

export const watchOption = IS_DEV
  ? {
      chokidar: {
        awaitWriteFinish: true,
      },
    }
  : undefined

export const withPageConfig = (config: UserConfig) =>
  defineConfig(
    deepmerge(
      {
        define: {
          'process.env': env,
        },
        base: '',
        plugins: [
          react(),
          IS_DEV && watchRebuildPlugin({ refresh: true }),
          IS_DEV && watchI18nPlugin(),
        ],
        build: {
          sourcemap: IS_DEV || ENABLE_SOURCEMAPS,
          minify: IS_PROD && !ENABLE_SOURCEMAPS,
          reportCompressedSize: IS_PROD,
          emptyOutDir: IS_PROD,
          watch: watchOption,
          rollupOptions: {
            external: ['chrome'],
          },
        },
      },
      config,
    ),
  )
