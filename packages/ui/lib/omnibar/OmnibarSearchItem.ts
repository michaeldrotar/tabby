export type OmnibarSearchItem = {
  id: string | number
  type: 'tab' | 'bookmark' | 'history' | 'command' | 'url' | 'search'
  title: string
  url?: string
  favIconUrl?: string
  windowId?: number
  tabId?: number
}
