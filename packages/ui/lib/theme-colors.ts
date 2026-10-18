export type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'
export {
  THEME_ACCENT_PALETTES,
  THEME_ACCENT_STRENGTH_OPTIONS,
  THEME_NEUTRAL_PALETTES,
} from '@extension/core'

export const THEME_MODE_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const
