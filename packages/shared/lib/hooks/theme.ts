import { useStorage } from './use-storage.js'
import { themeStorage } from '@extension/storage'
import { useEffect } from 'react'
import type { ThemeStateType } from '@extension/storage/lib/base/types.js'

export const useThemeStorage = (): ThemeStateType => {
  return useStorage(themeStorage)
}

export const useThemeApplicator = () => {
  const { theme } = useThemeStorage()
  useEffect(() => {
    if (theme) {
      document.body.setAttribute('data-theme', theme)
    } else {
      document.body.removeAttribute('data-theme')
    }
  }, [theme])
}
