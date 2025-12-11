import { useStorage } from './use-storage.js'
import { preferenceStorage } from '@extension/storage'
import { useEffect } from 'react'
import type { PreferenceStateType } from '@extension/storage/lib/base/types.js'

export const usePreferenceStorage = (): PreferenceStateType => {
  return useStorage(preferenceStorage)
}

export const useThemeApplicator = () => {
  const { theme } = usePreferenceStorage()
  useEffect(() => {
    if (theme) {
      document.body.setAttribute('data-theme', theme)
    } else {
      document.body.removeAttribute('data-theme')
    }
  }, [theme])
}
