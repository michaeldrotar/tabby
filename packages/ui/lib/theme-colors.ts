/**
 * Theme color palette types and constants
 *
 * These correspond to the CSS custom properties defined in
 * @extension/tailwindcss-config/base.css and provide type-safe
 * access to available theme color options.
 */

/**
 * Neutral color palettes for backgrounds and foregrounds
 */
export type ThemeNeutralPalette =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone'

/**
 * Vibrant accent color palettes
 */
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

/**
 * All available neutral color palettes
 */
export const THEME_NEUTRAL_PALETTES = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const satisfies readonly ThemeNeutralPalette[]

/**
 * All available accent color palettes
 */
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
] as const satisfies readonly ThemeAccentPalette[]

/**
 * Available accent strength values (10-50%)
 * Controls the intensity/opacity of accent colors
 */
export const THEME_ACCENT_STRENGTH_OPTIONS = [
  10, 15, 20, 25, 30, 35, 40, 45, 50,
] as const
