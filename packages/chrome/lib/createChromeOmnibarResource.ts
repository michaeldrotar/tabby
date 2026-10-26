import { createAsyncQueue } from '@extension/core/asyncQueue'
import { OmnibarCancelledError } from '@extension/core/omnibar'
import { readOmnibarChoices } from '@extension/core/omnibarChoices'
import { createOmnibarMatcher } from '@extension/core/omnibarMatching'
import { normalizeClosedSessions } from './closedSessions.js'
import { createChromeOmnibarNavigator } from './createChromeOmnibarNavigator.js'
import { getChromeFaviconUrl } from './favicon.js'
import type {
  OmnibarAction,
  OmnibarChoice,
  OmnibarMetadata,
  OmnibarModifier,
  OmnibarResource,
  OmnibarResult,
} from '@extension/core'

export type ChromeOmnibarApi = Pick<
  typeof chrome,
  | 'windows'
  | 'tabs'
  | 'tabGroups'
  | 'bookmarks'
  | 'history'
  | 'sessions'
  | 'storage'
  | 'runtime'
  | 'commands'
  | 'sidePanel'
>

/** One host-owned search and navigation resource; all browser access is injected. */
export const createChromeOmnibarResource = (
  api: ChromeOmnibarApi,
  requestedWindowId?: number,
): OmnibarResource => {
  let metadata: OmnibarMetadata = {
    loaded: false,
    initialQuery: '',
    originalWindowId: requestedWindowId,
    isMac: false,
  }
  const listeners = new Set<() => void>()
  let generation = 0
  let started: Promise<void> | undefined
  let disposed = false
  const writes = createAsyncQueue()
  let savedQuery: string | undefined
  let queryVersion = 0
  const current = (operation = generation) => {
    if (disposed)
      throw new OmnibarCancelledError('The Omnibar resource has been disposed.')
    if (operation !== generation) throw new OmnibarCancelledError()
  }
  const loadChoices = async (windowId?: number): Promise<OmnibarChoice[]> => {
    if (windowId === undefined) return []
    try {
      const response = await api.runtime.sendMessage({
        type: 'tabby-omnibar-choices',
        windowId,
      })
      return readOmnibarChoices(response?.choices, Date.now())
    } catch {
      return []
    }
  }
  const navigate = async (
    action: OmnibarAction,
    modifier: OmnibarModifier | undefined,
    operation: number,
    choice?: OmnibarChoice,
  ) => {
    if (!choice)
      return createChromeOmnibarNavigator(
        api,
        metadata.originalWindowId,
        current,
      )(action, modifier, operation)
    const response = await api.runtime.sendMessage({
      type: 'tabby-omnibar-execute',
      action,
      modifier,
      windowId: metadata.originalWindowId,
      choice,
    })
    if (!response?.success)
      throw new Error(response?.error ?? 'Could not open this search result.')
    current(operation)
    await refreshChoices()
  }
  const queueQuery = (query?: string) => {
    const operation = generation
    savedQuery = query
    queryVersion++
    return writes.run(async () => {
      current(operation)
      if (query === undefined) await api.storage.local.remove('lastQuery')
      else await api.storage.local.set({ lastQuery: query })
    })
  }
  const refreshChoices = async (operation = generation) => {
    const choices = await loadChoices(metadata.originalWindowId)
    if (disposed || generation !== operation) return
    metadata = { ...metadata, choices }
    listeners.forEach((listener) => listener())
  }
  const clearQuery = () => queueQuery()
  const execute = async (
    action: OmnibarAction,
    modifier?: OmnibarModifier,
    choice?: OmnibarChoice,
  ) => {
    current()
    const operation = generation
    const previousQuery = savedQuery
    const clear = clearQuery()
    const clearVersion = queryVersion
    try {
      if (action.kind === 'tab-manager') {
        // Side-panel opening requires the originating user gesture.
        const opening = navigate(action, modifier, operation, choice)
        await Promise.all([opening, clear])
      } else {
        await clear
        // A newer edit must finish persisting before navigation can close the host.
        await writes.wait()
        await navigate(action, modifier, operation, choice)
      }
    } catch (error) {
      if (
        !disposed &&
        generation === operation &&
        queryVersion === clearVersion
      )
        await queueQuery(previousQuery).catch(() => undefined)
      throw error
    }
  }
  return {
    getSnapshot: () => metadata,
    getFaviconUrl: (url) => getChromeFaviconUrl(api.runtime, url),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: () => {
      if (started) return started
      disposed = false
      const token = ++generation
      started = (async () => {
        const [query, platform, commands, window] = await Promise.allSettled([
          api.storage.local.get('lastQuery'),
          api.runtime.getPlatformInfo(),
          api.commands.getAll(),
          requestedWindowId === undefined
            ? api.windows.getLastFocused()
            : Promise.resolve({ id: requestedWindowId }),
        ])
        if (token !== generation || disposed) return
        if (queryVersion === 0)
          savedQuery =
            query.status === 'fulfilled' &&
            typeof query.value.lastQuery === 'string'
              ? query.value.lastQuery
              : undefined
        const originalWindowId =
          window.status === 'fulfilled' ? window.value.id : requestedWindowId
        const choices = await loadChoices(originalWindowId)
        if (token !== generation || disposed) return
        metadata = {
          loaded: true,
          initialQuery: savedQuery ?? '',
          isMac: platform.status === 'fulfilled' && platform.value.os === 'mac',
          originalWindowId,
          choices,
          openTabManagerShortcut:
            commands.status === 'fulfilled'
              ? commands.value.find(
                  (command) => command.name === 'open-tab-manager',
                )?.shortcut
              : undefined,
        }
        for (const listener of listeners) listener()
      })()
      return started
    },
    dispose: () => {
      disposed = true
      generation++
      started = undefined
      listeners.clear()
    },
    search: async (query) => {
      current()
      const token = generation
      const [history, bookmarks, sessions] = await Promise.allSettled([
        api.history.search({ text: query, maxResults: 20, startTime: 0 }),
        api.bookmarks.search(query),
        api.sessions.getRecentlyClosed(),
      ])
      if (token !== generation || disposed) return []
      const closed: OmnibarResult[] = []
      const matches = createOmnibarMatcher(query)
      if (sessions.status === 'fulfilled')
        for (const session of normalizeClosedSessions(
          sessions.value,
          api.runtime,
        )) {
          const tab = session.tabs.find((tab) => matches(tab.title, tab.url))
          if (tab) {
            const { sessionId } = session
            closed.push({
              id:
                session.kind === 'tab'
                  ? `recently-closed-${sessionId}`
                  : `closed-window-${sessionId}`,
              type: 'recently-closed',
              title: tab.title || 'Untitled',
              url: tab.url,
              favIconUrl: tab.faviconUrl,
              description:
                session.kind === 'tab'
                  ? 'Recently closed'
                  : 'Restore entire window',
              sessionId,
              lastVisitTime: session.closedAt,
              tabCount:
                session.kind === 'window' ? session.tabs.length : undefined,
              action: { kind: 'restore', sessionId },
            })
          }
        }
      const favicon = (url?: string) =>
        url ? getChromeFaviconUrl(api.runtime, url) : undefined
      return [
        ...closed,
        ...(bookmarks.status === 'fulfilled'
          ? bookmarks.value
              .filter((bookmark) => bookmark.url)
              .map(
                (bookmark): OmnibarResult => ({
                  id: bookmark.id,
                  type: 'bookmark',
                  title: bookmark.title,
                  url: bookmark.url,
                  favIconUrl: favicon(bookmark.url),
                  description: 'Bookmark',
                  action: { kind: 'url', url: bookmark.url! },
                }),
              )
          : []),
        ...(history.status === 'fulfilled'
          ? history.value
              .filter((item) => item.url)
              .map(
                (item): OmnibarResult => ({
                  id: item.id,
                  type: 'history',
                  title: item.title || item.url || 'Untitled',
                  url: item.url,
                  favIconUrl: favicon(item.url),
                  description: 'History',
                  lastVisitTime: item.lastVisitTime,
                  action: { kind: 'url', url: item.url! },
                }),
              )
          : []),
      ]
    },
    execute,
    saveQuery: (query) => queueQuery(query),
    clearQuery,
  }
}
