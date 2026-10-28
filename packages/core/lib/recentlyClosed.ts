export type ClosedTab = {
  title: string
  url?: string
  faviconUrl?: string
}

export type ClosedSession = {
  sessionId: string
  kind: 'tab' | 'window'
  closedAt: number
  tabs: readonly ClosedTab[]
}

export type RecentlyClosedSnapshot = {
  status: 'loading' | 'ready' | 'error'
  sessions: readonly ClosedSession[]
  restoringSessionId?: string
  error?: string
}

export interface RecentlyClosedResource {
  getSnapshot: () => RecentlyClosedSnapshot
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  refresh: () => Promise<void>
  restore: (sessionId: string) => Promise<void>
}
