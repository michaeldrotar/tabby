export type OmnibarSearchResult = {
  id: string | number
  type:
    | 'tab'
    | 'bookmark'
    | 'history'
    | 'command'
    | 'url'
    | 'search'
    | 'recently-closed'
  title: string
  url?: string
  description?: string
  favIconUrl?: string
  windowId?: number
  tabId?: number
  lastVisitTime?: number
  sessionId?: string
  tabCount?: number
  rank?: number
  execute: (
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => Promise<void>
}
