import { createStorage, StorageEnum } from '../base/index.js'
import type {
  PreferenceStateType,
  PreferenceStorageType,
} from '../base/index.js'

const storage = createStorage<PreferenceStateType>(
  'preference-storage-key',
  {
    theme: undefined,
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
  if (theme) {
    document.body.setAttribute('data-theme', theme)
  } else {
    document.body.removeAttribute('data-theme')
  }
}

export const preferenceStorage: PreferenceStorageType = {
  ...storage,
  toggleTheme: async () => {
    const currentState = await storage.get()
    setTheme(currentState.theme === 'light' ? 'dark' : 'light')
  },
}

export const loadPreferenceStorage = async (): Promise<void> => {
  const currentState = await storage.get()
  setTheme(currentState.theme)
}
