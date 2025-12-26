import type { BrowserTabGroupColor } from '@extension/chrome/lib/tabGroup/BrowserTabGroup'

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

/**
 * Color configuration.
 * Provides Tailwind classes for rendering each color.
 */
const TAB_GROUP_COLORS: Record<BrowserTabGroupColor, TabGroupColorConfig> = {
  grey: {
    label: 'Grey',
    dot: 'bg-gray-500',
    text: 'text-gray-800 dark:text-gray-200',
    bg: 'bg-gray-500/10',
  },
  blue: {
    label: 'Blue',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  red: {
    label: 'Red',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-500/10',
  },
  yellow: {
    label: 'Yellow',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  green: {
    label: 'Green',
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-500/10',
  },
  pink: {
    label: 'Pink',
    dot: 'bg-pink-500',
    text: 'text-pink-700 dark:text-pink-400',
    bg: 'bg-pink-500/10',
  },
  purple: {
    label: 'Purple',
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-500/10',
  },
  cyan: {
    label: 'Cyan',
    dot: 'bg-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  orange: {
    label: 'Orange',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-500/10',
  },
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
  return TAB_GROUP_COLORS[color ?? 'grey']
}
