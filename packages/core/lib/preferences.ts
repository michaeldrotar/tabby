export type ThemeNeutralPalette =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'

export type ThemeAccentPalette =
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'lime'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface PreferenceState {
  theme: ThemeMode
  themeLightBackground: ThemeNeutralPalette
  themeLightForeground: ThemeNeutralPalette
  themeLightAccent: ThemeAccentPalette
  themeLightAccentStrength: number
  themeDarkBackground: ThemeNeutralPalette
  themeDarkForeground: ThemeNeutralPalette
  themeDarkAccent: ThemeAccentPalette
  themeDarkAccentStrength: number
  tabManagerCompactIconMode: 'active' | 'first'
  tabManagerCompactLayout: 'icon' | 'list'
}

export interface PreferenceResource {
  getSnapshot: () => PreferenceState
  subscribe: (listener: () => void) => () => void
  set: (patch: Partial<PreferenceState>) => Promise<void>
  start: () => Promise<void>
  dispose: () => void
}

export const defaultPreferences: Readonly<PreferenceState> = Object.freeze({
  theme: 'system',
  themeLightBackground: 'stone',
  themeLightForeground: 'neutral',
  themeLightAccent: 'amber',
  themeLightAccentStrength: 15,
  themeDarkBackground: 'neutral',
  themeDarkForeground: 'zinc',
  themeDarkAccent: 'blue',
  themeDarkAccentStrength: 15,
  tabManagerCompactIconMode: 'active',
  tabManagerCompactLayout: 'icon',
})
