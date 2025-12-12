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
    const body = document.body
    if (!body) return

    if (theme) {
      body.setAttribute('data-theme', theme)
      return
    }

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    const applyFallbackTheme = () => {
      if (mediaQuery?.matches) {
        body.setAttribute('data-theme', 'dark')
      } else {
        body.removeAttribute('data-theme')
      }
    }

    applyFallbackTheme()

    if (!mediaQuery) return
    const handleChange = () => applyFallbackTheme()

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])
}
