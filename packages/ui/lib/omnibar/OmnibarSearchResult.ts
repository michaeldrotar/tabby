import type { BrowserTabGroupColor } from '@extension/chrome/tabGroup/BrowserTabGroup'

export type OmnibarSearchResult = {
  id: string | number
  type:
    | 'tab'
    | 'tab-group'
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
  groupColor?: BrowserTabGroupColor
  groupTabCount?: number
  groupWindowLabel?: string
  groupCollapsed?: boolean
  execute: (
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => Promise<void>
}
