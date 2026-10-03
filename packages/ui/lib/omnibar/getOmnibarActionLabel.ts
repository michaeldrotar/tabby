import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarActionLabel = (
  item: OmnibarSearchResult,
  modifier?: 'new-tab' | 'new-window',
) => {
  switch (item.type) {
    case 'tab':
      if (modifier === 'new-tab') return 'Open in New Tab'
      if (modifier === 'new-window') return 'Open in New Window'
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
