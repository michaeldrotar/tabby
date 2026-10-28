export type DownloadAction =
  | 'open'
  | 'show'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'erase'

export type RecentDownload = {
  id: number
  filename: string
  source?: string
  status: string
  actions: readonly DownloadAction[]
  warning: boolean
}

export type DownloadsSnapshot = {
  status: 'loading' | 'ready' | 'permission'
  items: readonly RecentDownload[]
  canOpen: boolean
  error?: string
}

export interface DownloadsResource {
  getSnapshot: () => DownloadsSnapshot
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  requestAccess: () => Promise<void>
  execute: (
    ids: number | readonly number[],
    action: DownloadAction,
  ) => Promise<void>
  openAll: () => Promise<void>
}
