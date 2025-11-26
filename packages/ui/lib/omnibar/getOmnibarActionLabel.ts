import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarActionLabel = (item: OmnibarSearchResult) => {
  switch (item.type) {
    case 'tab':
      return 'Jump to'
    case 'command':
      return 'Run'
    case 'url':
      return 'Open'
    case 'search':
      return 'Search'
    case 'recently-closed':
      return 'Restore'
    default:
      return 'Open'
  }
}
