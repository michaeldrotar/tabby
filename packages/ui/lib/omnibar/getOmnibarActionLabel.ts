import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const getOmnibarActionLabel = (item: OmnibarSearchItem) => {
  switch (item.type) {
    case 'tab':
      return 'Jump to'
    case 'command':
      return 'Run'
    case 'url':
      return 'Open'
    case 'search':
      return 'Search'
    case 'closed-tab':
      return 'Restore'
    default:
      return 'Open'
  }
}
