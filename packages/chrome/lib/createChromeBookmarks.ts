import { createAsyncQueue } from '@extension/core/asyncQueue'
import { isNavigableUrl } from '@extension/core/navigation'
import { getChromeFaviconUrl } from './favicon.js'
import type {
  BookmarkNode,
  BookmarkResource,
  BookmarkSnapshot,
} from '@extension/core/bookmarks'

export const createChromeBookmarks = (
  api: Pick<typeof chrome, 'bookmarks' | 'tabs' | 'windows' | 'runtime'>,
): BookmarkResource => {
  let snapshot: BookmarkSnapshot = { state: 'loading', roots: [] }
  let running = false
  let generation = 0
  let revision = 0
  let refreshTask: Promise<void> | undefined
  const subscribers = new Set<() => void>()
  const removeListeners: (() => void)[] = []
  const writes = createAsyncQueue()
  const publish = (next: BookmarkSnapshot) => {
    if (JSON.stringify(snapshot) === JSON.stringify(next)) return
    snapshot = next
    subscribers.forEach((listener) => listener())
  }
  const normalize = (
    node: chrome.bookmarks.BookmarkTreeNode,
    inheritedReadOnly = false,
  ): BookmarkNode => {
    const readOnly = inheritedReadOnly || Boolean(node.unmodifiable)
    return {
      id: node.id,
      title: node.title,
      url: node.url,
      readOnly,
      ...(node.url
        ? { faviconUrl: getChromeFaviconUrl(api.runtime, node.url, 32) }
        : {
            children: (node.children ?? []).map((child) =>
              normalize(child, readOnly),
            ),
          }),
    }
  }
  const refresh = (): Promise<void> => {
    revision++
    if (!running) return Promise.resolve()
    if (refreshTask) return refreshTask
    const operation = generation
    let observed = revision
    const task = (async () => {
      do {
        observed = revision
        try {
          const tree = await api.bookmarks.getTree()
          if (!running || operation !== generation) return
          if (observed !== revision) continue
          publish({
            state: 'loaded',
            roots: tree.map((node) => normalize(node)),
          })
        } catch (error) {
          if (!running || operation !== generation) return
          if (observed !== revision) continue
          publish({
            state: 'error',
            roots: snapshot.roots,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      } while (observed !== revision)
    })()
    refreshTask = task
    void task.finally(() => {
      if (refreshTask !== task) return
      refreshTask = undefined
      if (running && operation === generation && observed !== revision)
        void refresh()
    })
    return task
  }
  const requireRunning = () => {
    if (!running) throw new Error('The bookmark connection is not running.')
  }
  const write = <T>(operation: () => Promise<T>): Promise<T> => {
    const started = generation
    return writes.run(async () => {
      requireRunning()
      if (started !== generation)
        throw new Error('The bookmark connection was stopped.')
      try {
        return await operation()
      } finally {
        await refresh()
      }
    })
  }
  const getDestination = async (id: string) => {
    requireRunning()
    const [node] = await api.bookmarks.get(id)
    if (!node?.url || !isNavigableUrl(node.url))
      throw new Error('This bookmark cannot be opened.')
    return node.url
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      subscribers.add(listener)
      return () => subscribers.delete(listener)
    },
    refresh,
    start: () => {
      if (!running) {
        running = true
        generation++
        const onChange = () => {
          void refresh()
        }
        const events = [
          api.bookmarks.onCreated,
          api.bookmarks.onChanged,
          api.bookmarks.onMoved,
          api.bookmarks.onRemoved,
          api.bookmarks.onChildrenReordered,
          api.bookmarks.onImportEnded,
        ]
        events.forEach((event) => {
          event.addListener(onChange)
          removeListeners.push(() => event.removeListener(onChange))
        })
      }
      return refresh()
    },
    dispose: () => {
      running = false
      generation++
      refreshTask = undefined
      removeListeners.splice(0).forEach((remove) => remove())
    },
    createFolder: () =>
      write(async () => {
        const folder = await api.bookmarks.create({ title: 'Tabby Favorites' })
        return folder.id
      }),
    addCurrentTab: (folderId, windowId) =>
      write(async () => {
        const [tab] = await api.tabs.query({
          active: true,
          ...(windowId === undefined ? { currentWindow: true } : { windowId }),
        })
        const url = tab?.url
        if (!url || !isNavigableUrl(url))
          throw new Error('The current tab cannot be bookmarked.')
        const children = await api.bookmarks.getChildren(folderId)
        if (children.some((node) => node.url === url)) return false
        await api.bookmarks.create({
          parentId: folderId,
          title: tab.title || url,
          url,
        })
        return true
      }),
    remove: (id) =>
      write(async () => {
        const [node] = await api.bookmarks.get(id)
        if (!node?.url)
          throw new Error('Only individual bookmarks can be removed here.')
        await api.bookmarks.remove(id)
      }),
    open: async (id, mode, windowId) => {
      const url = await getDestination(id)
      if (mode === 'new-window') {
        await api.windows.create({ url, focused: true })
        return
      }
      const targetWindowId = windowId ?? (await api.windows.getCurrent()).id
      if (targetWindowId === undefined)
        throw new Error('No browser window is available.')
      if (mode === 'default') {
        const tabs = await api.tabs.query({ windowId: targetWindowId })
        const match = tabs.find((tab) => tab.url === url)
        if (match?.id !== undefined) {
          await api.tabs.update(match.id, { active: true })
          await api.windows.update(targetWindowId, { focused: true })
          return
        }
      }
      await api.tabs.create({
        url,
        windowId: targetWindowId,
        active: mode === 'default',
      })
    },
    openManager: async (folderId) => {
      requireRunning()
      await api.tabs.create({
        url: `chrome://bookmarks/${folderId ? `?id=${encodeURIComponent(folderId)}` : ''}`,
      })
    },
  }
}
