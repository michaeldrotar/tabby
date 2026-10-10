export type BrowserTabGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange'

export interface BrowserWindow {
  id: number
  type?: string
  incognito?: boolean
  focused?: boolean
}

export interface BrowserTab {
  id: number
  windowId: number
  index: number
  title: string
  url?: string
  active?: boolean
  pinned?: boolean
  discarded?: boolean
  loading?: boolean
  audible?: boolean
  muted?: boolean
  faviconUrl?: string
  lastAccessed?: number
  groupId?: number
}

export interface BrowserTabGroup {
  id: number
  windowId: number
  title?: string
  color: BrowserTabGroupColor
  collapsed?: boolean
}

export interface BrowserSnapshot {
  state: 'loading' | 'loaded' | 'error'
  revision: number
  windows: readonly BrowserWindow[]
  tabs: readonly BrowserTab[]
  groups: readonly BrowserTabGroup[]
  error?: string
}

export type BrowserCommand =
  | { type: 'create-window' }
  | { type: 'close-tabs'; tabIds: readonly number[] }
  | { type: 'close-window'; windowId: number }
  | { type: 'activate-tab'; tabId: number }
  | { type: 'activate-window'; windowId: number }
  | { type: 'set-group-collapsed'; groupId: number; collapsed: boolean }

export interface CommandOutcome {
  status: 'success' | 'partial' | 'failed' | 'ignored'
  requestedIds: readonly number[]
  succeededIds: readonly number[]
  failures: readonly { id: number; message: string }[]
  createdWindowIds?: readonly number[]
  createdTabIds?: readonly number[]
}

export interface BrowserBackend {
  getSnapshot: () => BrowserSnapshot
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  execute: (command: BrowserCommand) => Promise<CommandOutcome>
}

export interface HostCapabilities {
  openSearch?: () => void
  openOptions?: () => void
  writeClipboardText?: (text: string) => Promise<void>
}
