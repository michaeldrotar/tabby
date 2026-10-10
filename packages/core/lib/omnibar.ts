import type { BrowserTabGroup } from './browser.js'

export class OmnibarCancelledError extends Error {
  constructor(message = 'The Omnibar action was cancelled.') {
    super(message)
    this.name = 'AbortError'
  }
}

export type OmnibarModifier = 'new-tab' | 'new-window'
export type OmnibarAction =
  | { kind: 'url'; url: string }
  | { kind: 'tab'; tabId: number; windowId: number; url?: string }
  | { kind: 'group'; groupId: number }
  | { kind: 'window'; windowId: number }
  | { kind: 'restore'; sessionId: string }
  | { kind: 'tab-manager' }
  | { kind: 'options' }

export type OmnibarResult = {
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
  active?: boolean
  lastVisitTime?: number
  ageLabel?: string
  sessionId?: string
  tabCount?: number
  groupColor?: BrowserTabGroup['color']
  groupTabCount?: number
  groupWindowLabel?: string
  groupCollapsed?: boolean
  action: OmnibarAction
}

export type OmnibarMetadata = {
  loaded: boolean
  initialQuery: string
  originalWindowId?: number
  isMac: boolean
  openTabManagerShortcut?: string
}

/** Owned by a host, shared or isolated independently of the browser and view resources. */
export type OmnibarResource = {
  getSnapshot: () => OmnibarMetadata
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  getFaviconUrl?: (url: string) => string | undefined
  search: (query: string) => Promise<OmnibarResult[]>
  /** Successful activation clears the saved query; dismissal preserves it. */
  execute: (action: OmnibarAction, modifier?: OmnibarModifier) => Promise<void>
  saveQuery: (query: string) => Promise<void>
  clearQuery: () => Promise<void>
}
