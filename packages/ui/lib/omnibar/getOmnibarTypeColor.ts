import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarTypeColor = (type: OmnibarSearchResult['type']) => {
  switch (type) {
    case 'tab':
      return 'text-primary'
    case 'command':
      return 'text-primary'
    default:
      return 'text-muted-foreground'
  }
}
