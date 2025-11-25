import type { OmnibarSearchItem } from './OmnibarSearchItem'

export const getOmnibarTypeLabel = (item: OmnibarSearchItem) => {
  switch (item.type) {
    case 'closed-tab':
      return 'Recently Closed'
    default:
      return item.type
  }
}
