import deepmerge from 'deepmerge'
import type { Config } from 'tailwindcss'

export const withUI = (tailwindConfig: Config): Config =>
  deepmerge(tailwindConfig, {
    content: ['../packages/ui/lib/**/*.{ts,tsx}'],
    darkMode: [
      'variant',
      [
        '@media (prefers-color-scheme: dark) { &:not([data-theme="light"] *) }',
        '&:is([data-theme="dark"] *)',
      ],
    ],
  })
