import { createStorage, StorageEnum } from '../base/index.js'
import type { ThemeStateType, ThemeStorageType } from '../base/index.js'

const storage = createStorage<ThemeStateType>(
  'theme-storage-key',
  {
    theme: undefined,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
)

const setTheme = async (theme: ThemeStateType['theme']) => {
  await storage.set(() => {
    return {
      theme,
    }
  })
  if (theme) {
    document.body.setAttribute('data-theme', theme)
  } else {
    document.body.removeAttribute('data-theme')
  }
}

export const themeStorage: ThemeStorageType = {
  ...storage,
  toggle: async () => {
    const currentState = await storage.get()
    setTheme(currentState.theme === 'light' ? 'dark' : 'light')
  },
}

export const loadThemeStorage = async (): Promise<void> => {
  const currentState = await storage.get()
  setTheme(currentState.theme)
}
