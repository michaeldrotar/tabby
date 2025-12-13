import { createStorage, StorageEnum } from '../base/index.js'
import type {
  PreferenceStateType,
  PreferenceStorageType,
} from '../base/index.js'

const storage = createStorage<PreferenceStateType>(
  'preference-storage-key',
  {
    theme: 'system',
    themeBackground: 'neutral',
    themeForeground: 'zinc',
    themeAccent: 'blue',
    tabManagerCompactIconMode: 'active',
    tabManagerCompactLayout: 'icon',
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
)

const setTheme = async (theme: PreferenceStateType['theme']) => {
  await storage.set((prev) => {
    return {
      ...prev,
      theme,
    }
  })

  const resolveTheme = (): 'light' | 'dark' => {
    if (theme === 'light' || theme === 'dark') return theme

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    return mediaQuery?.matches ? 'dark' : 'light'
  }

  document.body.setAttribute('data-theme', resolveTheme())
}

export const preferenceStorage: PreferenceStorageType = {
  ...storage,
}

export const loadPreferenceStorage = async (): Promise<void> => {
  const currentState = await storage.get()
  setTheme(currentState.theme)
}
