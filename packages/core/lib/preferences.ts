export const THEME_NEUTRAL_PALETTES = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const
export const THEME_ACCENT_PALETTES = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const
export const THEME_ACCENT_STRENGTH_OPTIONS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50,
] as const
export type ThemeNeutralPalette = (typeof THEME_NEUTRAL_PALETTES)[number]
export type ThemeAccentPalette = (typeof THEME_ACCENT_PALETTES)[number]

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
  reset: () => Promise<void>
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

const isValidPreference = (key: string, value: unknown): boolean => {
  if (key === 'theme')
    return (
      typeof value === 'string' && ['system', 'light', 'dark'].includes(value)
    )
  if (key === 'tabManagerCompactIconMode')
    return value === 'active' || value === 'first'
  if (key === 'tabManagerCompactLayout')
    return value === 'icon' || value === 'list'
  if (!Object.hasOwn(defaultPreferences, key)) return false
  if (key.endsWith('AccentStrength'))
    return (
      typeof value === 'number' &&
      THEME_ACCENT_STRENGTH_OPTIONS.some((strength) => strength === value)
    )
  if (key.endsWith('Accent'))
    return THEME_ACCENT_PALETTES.some((palette) => palette === value)
  return THEME_NEUTRAL_PALETTES.some((palette) => palette === value)
}

/** Accept persisted partial values while replacing invalid fields with defaults. */
export const normalizePreferences = (value: unknown): PreferenceState => {
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  return Object.fromEntries(
    Object.entries(defaultPreferences).map(([key, fallback]) => [
      key,
      isValidPreference(key, record[key]) ? record[key] : fallback,
    ]),
  ) as unknown as PreferenceState
}
export const applyPreferencePatch = (
  state: PreferenceState,
  patch: Partial<PreferenceState>,
): PreferenceState => {
  for (const [key, value] of Object.entries(patch))
    if (!isValidPreference(key, value))
      throw new Error(`Invalid preference: ${key}`)
  return { ...state, ...patch }
}
