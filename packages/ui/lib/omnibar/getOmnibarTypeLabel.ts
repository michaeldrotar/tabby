import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarTypeLabel = (item: OmnibarSearchResult) => {
  switch (item.type) {
    case 'tab-group':
      return 'Tab group'
    case 'recently-closed':
      return 'Recently Closed'
    default:
      return item.type
  }
}
