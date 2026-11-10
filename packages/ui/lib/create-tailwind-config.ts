import baseConfig from './base-tailwind-config.js'
import type { Config } from 'tailwindcss'

export const createTailwindConfig = (...configs: Partial<Config>[]): Config => {
  return {
    presets: [
      baseConfig,
      ...configs.map(({ content: _content, presets = [], ...config }) => ({
        ...config,
        ...(presets.length ? { presets } : {}),
      })),
    ],
    darkMode:
      configs.findLast((config) => config.darkMode !== undefined)?.darkMode ??
      baseConfig.darkMode,
    content: configs.flatMap((config) => {
      const content = config.content ?? []
      return Array.isArray(content) ? content : content.files
    }),
  }
}
