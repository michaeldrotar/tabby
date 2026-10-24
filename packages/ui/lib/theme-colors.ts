import { additionalNeutralColors } from './tailwind-neutral-colors'
import type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'

export type { ThemeAccentPalette, ThemeNeutralPalette } from '@extension/core'
export { THEME_ACCENT_PALETTES, THEME_NEUTRAL_PALETTES } from '@extension/core'

export const neutralSwatchByPalette = {
  slate: 'bg-slate-500',
  gray: 'bg-gray-500',
  zinc: 'bg-zinc-500',
  neutral: 'bg-neutral-500',
  stone: 'bg-stone-500',
  taupe: 'bg-taupe-500',
  mauve: 'bg-mauve-500',
  mist: 'bg-mist-500',
  olive: 'bg-olive-500',
} satisfies Record<ThemeNeutralPalette, string>
export const accentSwatchByPalette = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
} satisfies Record<ThemeAccentPalette, string>

export { additionalNeutralColors }
export const neutralSwatchColors = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
  taupe: additionalNeutralColors.taupe[500],
  mauve: additionalNeutralColors.mauve[500],
  mist: additionalNeutralColors.mist[500],
  olive: additionalNeutralColors.olive[500],
} satisfies Record<ThemeNeutralPalette, string>

export { curatedThemes, themeCollections, themeTokens } from '@extension/core'
