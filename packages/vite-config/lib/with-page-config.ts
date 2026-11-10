import { env } from '@extension/env/config'
import { getEnv } from '@extension/env/getEnv'
import { watchI18nPlugin } from '@extension/hmr/plugins/watch-i18n-plugin'
import { watchRebuildPlugin } from '@extension/hmr/plugins/watch-rebuild-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig, mergeConfig } from 'vite'
import type { UserConfig } from 'vite'

const ENV = getEnv()

export const watchOption = ENV['IS_DEV']
  ? {
      watcher: {
        useDebounce: true,
        debounceDelay: 2000,
      },
    }
  : undefined

export const withPageConfig = (config: UserConfig) => {
  return defineConfig(
    mergeConfig(
      {
        define: {
          'process.env': env,
        },
        base: '',
        plugins: [
          tailwindcss(),
          react(),
          ENV['IS_DEV'] && watchRebuildPlugin({ refresh: true }),
          ENV['IS_DEV'] && watchI18nPlugin(),
        ],
        build: {
          target: 'chrome127',
          sourcemap: ENV['IS_DEV'] || ENV['ENABLE_SOURCEMAPS'],
          minify: ENV['IS_PROD'] && !ENV['ENABLE_SOURCEMAPS'],
          reportCompressedSize: ENV['IS_PROD'],
          emptyOutDir: ENV['IS_PROD'],
          watch: watchOption,
          rolldownOptions: {
            external: ['chrome'],
          },
        },
      },
      config,
    ),
  )
}
