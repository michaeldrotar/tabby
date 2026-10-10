import { OmnibarCancelledError } from '@extension/core/omnibar'
import { getChromeFaviconUrl } from './favicon.js'
import type {
  OmnibarAction,
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
  let writes = Promise.resolve()
  let savedQuery: string | undefined
  let queryVersion = 0
  const current = (operation = generation) => {
    if (disposed)
      throw new OmnibarCancelledError('The Omnibar resource has been disposed.')
    if (operation !== generation) throw new OmnibarCancelledError()
  }
  const openUrl = async (
    url: string,
    modifier?: OmnibarModifier,
    fallbackWindowId?: number,
    operation = generation,
  ) => {
    current(operation)
    if (modifier === 'new-window') {
      await api.windows.create({ url, focused: true })
      return
    }
    const windowId = metadata.originalWindowId ?? fallbackWindowId
    if (modifier === 'new-tab') {
      await api.tabs.create({
        ...(windowId === undefined ? {} : { windowId }),
        url,
        active: true,
      })
      current(operation)
      if (windowId !== undefined)
        await api.windows.update(windowId, { focused: true })
      return
    }
    if (windowId !== undefined) {
      const [tab] = await api.tabs.query({ windowId, active: true })
      current(operation)
      if (tab?.id !== undefined)
        await api.tabs.update(tab.id, { url, active: true })
      else await api.tabs.create({ windowId, url, active: true })
      current(operation)
      await api.windows.update(windowId, { focused: true })
    } else await api.tabs.update({ url })
  }
  const navigate = async (
    action: OmnibarAction,
    modifier: OmnibarModifier | undefined,
    operation: number,
  ) => {
    current(operation)
    switch (action.kind) {
      case 'url':
        await openUrl(action.url, modifier, undefined, operation)
        break
      case 'tab':
        if (modifier && action.url) {
          try {
            await openUrl(action.url, modifier, action.windowId, operation)
            return
          } catch {
            current(operation)
          }
        }
        // Activate first: focusing a different window can close the popup host.
        await api.tabs.update(action.tabId, { active: true })
        current(operation)
        await api.windows.update(action.windowId, { focused: true })
        break
      case 'group': {
        const [groups, tabs] = await Promise.all([
          api.tabGroups.query({}),
          api.tabs.query({ groupId: action.groupId }),
        ])
        current(operation)
        const group = groups.find(
          (candidate) => candidate.id === action.groupId,
        )
        const members = tabs
          .filter(
            (tab): tab is chrome.tabs.Tab & { id: number } =>
              tab.id !== undefined,
          )
          .sort((a, b) => a.index - b.index)
        const tab = members.find((member) => member.active) ?? members[0]
        if (!group || !tab)
          throw new Error('This tab group is no longer available.')
        if (group.collapsed)
          await api.tabGroups.update(group.id, { collapsed: false })
        current(operation)
        await api.tabs.update(tab.id, { active: true })
        current(operation)
        await api.windows.update(group.windowId, { focused: true })
        break
      }
      case 'window':
        await api.windows.update(action.windowId, { focused: true })
        break
      case 'restore':
        await api.sessions.restore(action.sessionId)
        break
      case 'tab-manager': {
        const windowId =
          metadata.originalWindowId ?? (await api.windows.getLastFocused()).id
        current(operation)
        if (windowId !== undefined) await api.sidePanel.open({ windowId })
        break
      }
      case 'options':
        await api.runtime.openOptionsPage()
        break
    }
  }
  const queueQuery = (query?: string) => {
    const operation = generation
    savedQuery = query
    queryVersion++
    const result = writes
      .catch(() => undefined)
      .then(async () => {
        current(operation)
        if (query === undefined) await api.storage.local.remove('lastQuery')
        else await api.storage.local.set({ lastQuery: query })
      })
    writes = result
    return result
  }
  const clearQuery = () => queueQuery()
  const execute = async (action: OmnibarAction, modifier?: OmnibarModifier) => {
    current()
    const operation = generation
    const previousQuery = savedQuery
    const clear = clearQuery()
    const clearVersion = queryVersion
    try {
      if (action.kind === 'tab-manager') {
        // Side-panel opening requires the originating user gesture.
        const opening = navigate(action, modifier, operation)
        await Promise.all([opening, clear])
      } else {
        await clear
        // A newer edit must finish persisting before navigation can close the host.
        await writes
        await navigate(action, modifier, operation)
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
      started = Promise.allSettled([
        api.storage.local.get('lastQuery'),
        api.runtime.getPlatformInfo(),
        api.commands.getAll(),
        requestedWindowId === undefined
          ? api.windows.getLastFocused()
          : Promise.resolve({ id: requestedWindowId }),
      ]).then(([query, platform, commands, window]) => {
        if (token !== generation || disposed) return
        if (queryVersion === 0)
          savedQuery =
            query.status === 'fulfilled' &&
            typeof query.value.lastQuery === 'string'
              ? query.value.lastQuery
              : undefined
        metadata = {
          loaded: true,
          initialQuery: savedQuery ?? '',
          isMac: platform.status === 'fulfilled' && platform.value.os === 'mac',
          originalWindowId:
            window.status === 'fulfilled' ? window.value.id : requestedWindowId,
          openTabManagerShortcut:
            commands.status === 'fulfilled'
              ? commands.value.find(
                  (command) => command.name === 'open-tab-manager',
                )?.shortcut
              : undefined,
        }
        for (const listener of listeners) listener()
      })
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
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
      if (sessions.status === 'fulfilled')
        for (const session of sessions.value) {
          const tabs = session.tab
            ? [session.tab]
            : (session.window?.tabs ?? [])
          tabs.forEach((tab, index) => {
            const sessionId =
              session.tab?.sessionId ?? session.window?.sessionId
            if (
              !sessionId ||
              !terms.every((term) =>
                `${tab.title ?? ''} ${tab.url ?? ''}`
                  .toLowerCase()
                  .includes(term),
              )
            )
              return
            closed.push({
              id: session.tab
                ? `recently-closed-${sessionId}`
                : `closed-window-${sessionId}-tab-${index}`,
              type: 'recently-closed',
              title: tab.title || 'Untitled',
              url: tab.url,
              favIconUrl:
                tab.favIconUrl ||
                (tab.url
                  ? getChromeFaviconUrl(api.runtime, tab.url)
                  : undefined),
              description: session.tab
                ? 'Recently Closed'
                : 'Recently Closed Window',
              sessionId,
              lastVisitTime: session.lastModified * 1000,
              tabCount: session.window?.tabs?.length,
              action: { kind: 'restore', sessionId },
            })
          })
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
