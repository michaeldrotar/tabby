import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarActionLabel = (item: OmnibarSearchResult) => {
  switch (item.type) {
    case 'tab':
      return 'Jump to'
    case 'tab-group':
      return 'Jump to group'
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
