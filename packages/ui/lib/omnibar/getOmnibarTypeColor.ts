import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarTypeColor = (type: OmnibarSearchResult['type']) => {
  switch (type) {
    case 'tab':
      return 'text-red-600 dark:text-red-300'
    case 'bookmark':
      return 'text-amber-600 dark:text-amber-400'
    case 'history':
      return 'text-teal-600 dark:text-teal-400'
    case 'command':
      return 'text-purple-600 dark:text-purple-400'
    case 'url':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'search':
      return 'text-indigo-600 dark:text-indigo-400'
    case 'recently-closed':
      return 'text-orange-600 dark:text-orange-400'
    default:
      return 'text-stone-500 dark:text-neutral-400'
  }
}
