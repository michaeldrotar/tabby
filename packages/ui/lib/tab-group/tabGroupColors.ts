import { t } from '@extension/i18n/t'
import type { BrowserTabGroupColor } from '@extension/chrome/tabGroup/BrowserTabGroup'

/**
 * Tab group color configuration matching Chrome's chrome.tabGroups.Color enum.
 * Uses Tailwind classes exclusively—no hex values or inline styles.
 *
 * @see https://developer.chrome.com/docs/extensions/reference/api/tabGroups#type-Color
 */

/** Tailwind classes and display label for a tab group color */
type TabGroupColorConfig = {
  label: string
  dot: string
  text: string
  bg: string
}

/** Static Tailwind classes for each color (label excluded - added dynamically via i18n) */
type TabGroupColorClasses = Omit<TabGroupColorConfig, 'label'>

/**
 * Color configuration.
 * Provides Tailwind classes for rendering each color.
 */
const TAB_GROUP_COLORS: Record<BrowserTabGroupColor, TabGroupColorClasses> = {
  grey: {
    dot: 'bg-gray-500',
    text: 'text-gray-800 dark:text-gray-200',
    bg: 'bg-gray-500/10',
  },
  blue: {
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  red: {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
  yellow: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  green: {
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  pink: {
    dot: 'bg-pink-500',
    text: 'text-pink-700 dark:text-pink-400',
    bg: 'bg-pink-500/10',
  },
  purple: {
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  cyan: {
    dot: 'bg-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  orange: {
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
}

/** i18n keys for each color label */
const COLOR_LABEL_KEYS: Record<BrowserTabGroupColor, string> = {
  grey: 'groupColor_grey',
  blue: 'groupColor_blue',
  red: 'groupColor_red',
  yellow: 'groupColor_yellow',
  green: 'groupColor_green',
  pink: 'groupColor_pink',
  purple: 'groupColor_purple',
  cyan: 'groupColor_cyan',
  orange: 'groupColor_orange',
}

/** All tab group color IDs for iteration (e.g., color pickers) */
export const TAB_GROUP_COLOR_IDS = Object.keys(
  TAB_GROUP_COLORS,
) as BrowserTabGroupColor[]

/**
 * Get Tailwind classes for a tab group color.
 * Falls back to grey for undefined colors.
 */
export const getGroupColorClasses = (
  color: BrowserTabGroupColor | undefined,
): TabGroupColorConfig => {
  const resolvedColor = color ?? 'grey'
  const classes = TAB_GROUP_COLORS[resolvedColor]
  // Cast needed because t() expects specific keys from LocalesJSONType
  const label = t(COLOR_LABEL_KEYS[resolvedColor] as Parameters<typeof t>[0])
  return { ...classes, label }
}
