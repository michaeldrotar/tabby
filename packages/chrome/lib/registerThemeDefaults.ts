import {
  defaultThemePreferences,
  normalizePreferences,
} from '@extension/core/preferences'
import { CHROME_PREFERENCES_STORAGE_KEY } from './createChromePreferences.js'

export const registerThemeDefaults = (
  api: Pick<typeof chrome, 'runtime' | 'storage'>,
): void => {
  api.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== 'install' && reason !== 'update') return
    try {
      const values = await api.storage.local.get(CHROME_PREFERENCES_STORAGE_KEY)
      await api.storage.local.set({
        [CHROME_PREFERENCES_STORAGE_KEY]: {
          ...normalizePreferences(values[CHROME_PREFERENCES_STORAGE_KEY]),
          ...defaultThemePreferences,
        },
      })
    } catch (error) {
      console.error('Failed to restore the default theme.', error)
    }
  })
}
