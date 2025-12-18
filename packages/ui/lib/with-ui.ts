import globalConfig from '@extension/tailwindcss-config'
import deepmerge from 'deepmerge'
import type { Config } from 'tailwindcss'

export const withUI = (tailwindConfig: Config): Config =>
  deepmerge(tailwindConfig, {
    content: ['../../packages/ui/lib/**/*.{ts,tsx}'],
    presets: [globalConfig],
    darkMode: [
      'variant',
      [
        '@media (prefers-color-scheme: dark) { &:not([data-theme="light"] *) }',
        '&:is([data-theme="dark"] *)',
      ],
    ],
  })
