import type { OmnibarSearchResult } from './OmnibarSearchResult'

export const getOmnibarTypeColor = (type: OmnibarSearchResult['type']) => {
  switch (type) {
    case 'tab':
      return 'text-accent'
    case 'bookmark':
      return 'text-accent/80'
    case 'history':
      return 'text-accent/70'
    case 'command':
      return 'text-muted-foreground'
    case 'url':
      return 'text-accent'
    case 'search':
      return 'text-accent/60'
    case 'recently-closed':
      return 'text-accent/80'
    default:
      return 'text-muted-foreground'
  }
}
