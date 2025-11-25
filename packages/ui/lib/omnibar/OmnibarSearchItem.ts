export type OmnibarSearchItem = {
  id: string | number
  type:
    | 'tab'
    | 'bookmark'
    | 'history'
    | 'command'
    | 'url'
    | 'search'
    | 'closed-tab'
  title: string
  url?: string
  favIconUrl?: string
  windowId?: number
  tabId?: number
  lastVisitTime?: number
  sessionId?: string
  tabCount?: number
}
