import { curatedThemes, themeTokens } from '@extension/core'
import { SummerThemeProvider } from '@extension/ui/SummerTheme'
import { Surface } from '@extension/ui/Surface'
import { useSyncExternalStore } from 'react'
import type { PreferenceResource, PreferenceState } from '@extension/core'
import type { SurfaceProps } from '@extension/ui/Surface'

export const resolveTheme = (
  preferences: PreferenceState,
  systemTheme: 'light' | 'dark',
) => {
  const theme = preferences.theme === 'system' ? systemTheme : preferences.theme
  return {
    theme,
    background:
      theme === 'light'
        ? preferences.themeLightBackground
        : preferences.themeDarkBackground,
    foreground:
      theme === 'light'
        ? preferences.themeLightForeground
        : preferences.themeDarkForeground,
    accent:
      theme === 'light'
        ? preferences.themeLightAccent
        : preferences.themeDarkAccent,
  }
}

export const PreferenceSurface = ({
  preferences,
  systemTheme,
  ...props
}: Omit<SurfaceProps, 'palette'> & {
  preferences: PreferenceResource
  systemTheme: 'light' | 'dark'
}) => {
  const state = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
    preferences.getSnapshot,
  )
  const palette = resolveTheme(
    { ...state, theme: props.theme ?? state.theme },
    systemTheme,
  )
  const preset = curatedThemes.find((theme) => theme.id === state.themePreset)
  return (
    <SummerThemeProvider
      theme={preset && 'scene' in preset ? palette.theme : undefined}
    >
      <Surface
        {...props}
        palette={palette}
        theme={palette.theme}
        tokens={{
          ...(preset ? themeTokens(preset[palette.theme]) : {}),
          ...props.tokens,
        }}
      />
    </SummerThemeProvider>
  )
}
