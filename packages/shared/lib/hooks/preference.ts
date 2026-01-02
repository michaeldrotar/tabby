import { preferenceStorage } from '@extension/storage/impl/preference-storage'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStorage } from './use-storage.js'
import type { PreferenceStateType } from '@extension/storage/base/types'

export const usePreferenceStorage = (): PreferenceStateType => {
  return useStorage(preferenceStorage)
}

/**
 * Returns the resolved theme ('light' or 'dark') based on user preference and system setting.
 * Automatically updates when system theme changes (if user selected 'system').
 */
export const useResolvedTheme = (): 'light' | 'dark' => {
  const { theme } = usePreferenceStorage()

  // Subscribe to system color scheme changes
  const systemTheme = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', callback)
      return () => mediaQuery.removeEventListener('change', callback)
    },
    (): 'light' | 'dark' =>
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    (): 'light' | 'dark' => 'light', // Server-side default
  )

  return useMemo((): 'light' | 'dark' => {
    if (theme === 'light' || theme === 'dark') return theme
    return systemTheme
  }, [theme, systemTheme])
}

export const useThemeApplicator = () => {
  const {
    themeLightBackground,
    themeLightForeground,
    themeLightAccent,
    themeLightAccentStrength,
    themeDarkBackground,
    themeDarkForeground,
    themeDarkAccent,
    themeDarkAccentStrength,
  } = usePreferenceStorage()
  const resolvedTheme = useResolvedTheme()

  useEffect(() => {
    const body = document.body
    if (!body) return

    body.setAttribute('data-theme', resolvedTheme)

    const resolvedAccentStrength =
      resolvedTheme === 'light'
        ? themeLightAccentStrength
        : themeDarkAccentStrength
    body.style.setProperty('--accent-strength', String(resolvedAccentStrength))

    const palettes =
      resolvedTheme === 'light'
        ? {
            background: themeLightBackground,
            foreground: themeLightForeground,
            accent: themeLightAccent,
          }
        : {
            background: themeDarkBackground,
            foreground: themeDarkForeground,
            accent: themeDarkAccent,
          }

    body.setAttribute('data-theme-background', palettes.background)
    body.setAttribute('data-theme-foreground', palettes.foreground)
    body.setAttribute('data-theme-accent', palettes.accent)
  }, [
    resolvedTheme,
    themeDarkAccent,
    themeDarkBackground,
    themeDarkForeground,
    themeDarkAccentStrength,
    themeLightAccent,
    themeLightBackground,
    themeLightForeground,
    themeLightAccentStrength,
  ])
}
