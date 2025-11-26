import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarTypeLabel = (item: OmnibarSearchResult) => {
  switch (item.type) {
    case 'recently-closed':
      return 'Recently Closed'
    default:
      return item.type
  }
}
