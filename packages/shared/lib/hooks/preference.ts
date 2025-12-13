import { useStorage } from './use-storage.js'
import { preferenceStorage } from '@extension/storage'
import { useEffect } from 'react'
import type { PreferenceStateType } from '@extension/storage/lib/base/types.js'

export const usePreferenceStorage = (): PreferenceStateType => {
  return useStorage(preferenceStorage)
}

export const useThemeApplicator = () => {
  const {
    theme,
    themeLightBackground,
    themeLightForeground,
    themeLightAccent,
    themeLightAccentStrength,
    themeDarkBackground,
    themeDarkForeground,
    themeDarkAccent,
    themeDarkAccentStrength,
  } = usePreferenceStorage()
  useEffect(() => {
    const body = document.body
    if (!body) return

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    const resolveTheme = (): 'light' | 'dark' => {
      if (theme === 'light' || theme === 'dark') return theme
      return mediaQuery?.matches ? 'dark' : 'light'
    }

    const applyResolvedThemeAndPalettes = () => {
      const resolvedTheme = resolveTheme()
      body.setAttribute('data-theme', resolvedTheme)

      const resolvedAccentStrength =
        resolvedTheme === 'light'
          ? themeLightAccentStrength
          : themeDarkAccentStrength
      body.style.setProperty(
        '--accent-strength',
        String(resolvedAccentStrength),
      )

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
    }

    applyResolvedThemeAndPalettes()

    if (theme !== 'system' || !mediaQuery) return
    const handleChange = () => applyResolvedThemeAndPalettes()

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [
    theme,
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
