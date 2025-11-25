import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const getOmnibarTypeColor = (type: OmnibarSearchItem['type']) => {
  switch (type) {
    case 'tab':
      return 'text-blue-600 dark:text-blue-400'
    case 'bookmark':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'history':
      return 'text-teal-600 dark:text-teal-400'
    case 'command':
      return 'text-purple-600 dark:text-purple-400'
    case 'url':
      return 'text-green-600 dark:text-green-400'
    case 'search':
      return 'text-indigo-600 dark:text-indigo-400'
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
}
