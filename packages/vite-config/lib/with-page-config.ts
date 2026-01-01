import { IS_DEV, IS_PROD } from '@extension/env'
import { baseEnv, dynamicEnvValues } from '@extension/env/config'
import { watchRebuildPlugin } from '@extension/hmr/watch-rebuild-plugin'
import react from '@vitejs/plugin-react-swc'
import deepmerge from 'deepmerge'
import { defineConfig } from 'vite'
import type { UserConfig } from 'vite'

const env = { ...baseEnv, ...dynamicEnvValues }

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
        plugins: [react(), IS_DEV && watchRebuildPlugin({ refresh: true })],
        build: {
          sourcemap: IS_DEV,
          minify: IS_PROD,
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
