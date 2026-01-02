import deepmerge from 'deepmerge'
import baseConfig from './tailwind.config.js'
import type { Config } from 'tailwindcss'

export const createTailwindConfig = (...configs: Partial<Config>[]): Config => {
  return deepmerge.all([{ presets: [baseConfig] }, ...configs]) as Config
}
