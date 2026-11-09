import baseConfig from './base-tailwind-config.js'
import type { Config } from 'tailwindcss'

export const createTailwindConfig = (...configs: Partial<Config>[]): Config => {
  return {
    presets: [
      baseConfig,
      ...configs.map(({ content: _content, presets = [], ...config }) => ({
        ...config,
        presets,
      })),
    ],
    content: configs.flatMap((config) => {
      const content = config.content ?? []
      return Array.isArray(content) ? content : content.files
    }),
  }
}
