export type BookmarkNode = {
  id: string
  title: string
  url?: string
  faviconUrl?: string
  readOnly?: boolean
  children?: readonly BookmarkNode[]
}

export type BookmarkSnapshot = {
  state: 'loading' | 'loaded' | 'error'
  roots: readonly BookmarkNode[]
  error?: string
}

export type BookmarkOpenMode = 'default' | 'new-tab' | 'new-window'

export interface BookmarkResource {
  getSnapshot: () => BookmarkSnapshot
  subscribe: (listener: () => void) => () => void
  start: () => Promise<void>
  dispose: () => void
  refresh: () => Promise<void>
  createFolder: () => Promise<string>
  addCurrentTab: (folderId: string, windowId?: number) => Promise<boolean>
  remove: (id: string) => Promise<void>
  open: (id: string, mode: BookmarkOpenMode, windowId?: number) => Promise<void>
  openManager: (folderId?: string) => Promise<void>
}

export const findBookmark = (
  nodes: readonly BookmarkNode[],
  id: string,
): BookmarkNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = node.children && findBookmark(node.children, id)
    if (child) return child
  }
  return undefined
}
