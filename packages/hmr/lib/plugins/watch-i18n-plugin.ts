import { resolve } from 'node:path'
import type { PluginOption } from 'vite'

/**
 * Watches the i18n messages.json file for changes and triggers a rebuild.
 * This is needed because the i18n package is pre-compiled and Vite doesn't
 * automatically detect changes to its source files.
 */
export const watchI18nPlugin = (): PluginOption => ({
  name: 'watch-i18n-plugin',
  buildStart() {
    // Watch all locale message files
    const i18nPath = resolve(
      import.meta.dirname,
      '..',
      '..',
      '..',
      'i18n',
      'locales',
    )
    this.addWatchFile(resolve(i18nPath, 'en', 'messages.json'))
  },
})
