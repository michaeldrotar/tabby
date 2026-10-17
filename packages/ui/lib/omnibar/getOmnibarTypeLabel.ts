import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarTypeLabel = (item: OmnibarSearchResult) => {
  switch (item.type) {
    case 'window':
      return 'Window'
    case 'tab-group':
      return 'Tab group'
    case 'recently-closed':
      return 'Recently closed'
    default:
      return item.type
  }
}
