import { useStorage } from './use-storage.js'
import { preferenceStorage } from '@extension/storage'
import { useEffect } from 'react'
import type { PreferenceStateType } from '@extension/storage/lib/base/types.js'

export const usePreferenceStorage = (): PreferenceStateType => {
  return useStorage(preferenceStorage)
}

export const useThemeApplicator = () => {
  const { theme, themeBackground, themeForeground, themeAccent } =
    usePreferenceStorage()
  useEffect(() => {
    const body = document.body
    if (!body) return

    body.setAttribute('data-theme-background', themeBackground)
    body.setAttribute('data-theme-foreground', themeForeground)
    body.setAttribute('data-theme-accent', themeAccent)

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    const resolveTheme = (): 'light' | 'dark' => {
      if (theme === 'light' || theme === 'dark') return theme
      return mediaQuery?.matches ? 'dark' : 'light'
    }

    const applyResolvedTheme = () => {
      body.setAttribute('data-theme', resolveTheme())
    }

    applyResolvedTheme()

    if (theme !== 'system' || !mediaQuery) return
    const handleChange = () => applyResolvedTheme()

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, themeBackground, themeForeground, themeAccent])
}
