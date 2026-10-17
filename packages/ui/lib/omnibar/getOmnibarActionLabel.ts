import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarActionLabel = (
  item: OmnibarSearchResult,
  modifier?: 'new-tab' | 'new-window',
) => {
  switch (item.type) {
    case 'window':
      return 'Focus'
    case 'tab':
      if (modifier === 'new-tab') return 'Open in new tab'
      if (modifier === 'new-window') return 'Open in new window'
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
