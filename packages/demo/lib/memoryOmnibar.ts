import { OmnibarCancelledError } from '@extension/core/omnibar'
import type {
  BrowserBackend,
  OmnibarMetadata,
  OmnibarResource,
  OmnibarResult,
} from '@extension/core'

export type MemoryOmnibarOptions = {
  getFaviconUrl?: (url: string) => string | undefined
  results?: readonly OmnibarResult[]
  initialQuery?: string
  originalWindowId?: number
  isMac?: boolean
  openTabManagerShortcut?: string
  commands?: 'apply' | 'ignore'
  onTabManager?: () => void | Promise<void>
  onOptions?: () => void | Promise<void>
}

/** Browser navigation against an injected memory backend, with no browser globals. */
export const createMemoryOmnibarResource = (
  browser: BrowserBackend,
  options: MemoryOmnibarOptions = {},
): OmnibarResource & {
  getSavedQuery: () => string
  restoreSavedQuery: (query: string) => void
} => {
  let metadata: OmnibarMetadata = {
    loaded: true,
    initialQuery: options.initialQuery ?? '',
    originalWindowId: options.originalWindowId,
    isMac: options.isMac ?? false,
    openTabManagerShortcut: options.openTabManagerShortcut,
  }
  const listeners = new Set<() => void>()
  let savedQuery = metadata.initialQuery
  let queryVersion = 0
  let disposed = false
  let generation = 0
  const current = (operation = generation) => {
    if (disposed)
      throw new OmnibarCancelledError('The Omnibar resource has been disposed.')
    if (operation !== generation) throw new OmnibarCancelledError()
  }
  const clearQuery = async () => {
    current()
    savedQuery = ''
    queryVersion++
  }
  const assertOutcome = async (
    command: Parameters<BrowserBackend['execute']>[0],
    operation: number,
  ) => {
    current(operation)
    const result = await browser.execute(command)
    current(operation)
    if (result.status === 'ignored') throw new OmnibarCancelledError()
    if (result.status === 'failed' || result.status === 'partial')
      throw new Error(
        result.failures[0]?.message ?? 'The action could not be completed.',
      )
  }
  return {
    getSnapshot: () => metadata,
    getFaviconUrl: options.getFaviconUrl,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: async () => {
      disposed = false
      generation++
      if (metadata.initialQuery !== savedQuery) {
        metadata = { ...metadata, initialQuery: savedQuery }
        listeners.forEach((listener) => listener())
      }
    },
    dispose: () => {
      disposed = true
      generation++
      listeners.clear()
    },
    search: async (query) => {
      current()
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
      return (options.results ?? []).filter((result) =>
        terms.every((term) =>
          `${result.title} ${result.url ?? ''}`.toLowerCase().includes(term),
        ),
      )
    },
    saveQuery: async (next) => {
      current()
      savedQuery = next
      queryVersion++
    },
    clearQuery,
    getSavedQuery: () => savedQuery,
    restoreSavedQuery: (query) => {
      current()
      savedQuery = query
      queryVersion++
      generation++
      metadata = { ...metadata, initialQuery: query }
      listeners.forEach((listener) => listener())
    },
    execute: async (action, modifier) => {
      current()
      if (options.commands === 'ignore') return
      const version = queryVersion
      const operation = generation
      const run = (command: Parameters<BrowserBackend['execute']>[0]) =>
        assertOutcome(command, operation)
      const snapshot = browser.getSnapshot()
      const windowId =
        options.originalWindowId ??
        snapshot.windows.find((window) => window.focused)?.id ??
        snapshot.windows[0]?.id
      const openUrl = async (url: string, targetWindowId = windowId) => {
        if (modifier === 'new-window') {
          await run({ type: 'create-window', url })
          return
        }
        if (modifier === 'new-tab') {
          await run({
            type: 'create-tab',
            windowId: targetWindowId,
            url,
          })
          return
        }
        const tab = snapshot.tabs.find(
          (tab) => tab.windowId === targetWindowId && tab.active,
        )
        if (tab) {
          await run({ type: 'navigate-tab', tabId: tab.id, url })
          await run({ type: 'activate-window', windowId: tab.windowId })
        } else
          await run({
            type: 'create-tab',
            windowId: targetWindowId,
            url,
          })
      }
      switch (action.kind) {
        case 'url':
          await openUrl(action.url)
          break
        case 'tab':
          if (modifier && action.url)
            await openUrl(
              action.url,
              options.originalWindowId ?? action.windowId,
            )
          else await run({ type: 'activate-tab', tabId: action.tabId })
          break
        case 'group': {
          const group = snapshot.groups.find(
            (group) => group.id === action.groupId,
          )
          const members = snapshot.tabs
            .filter((tab) => tab.groupId === action.groupId)
            .sort((a, b) => a.index - b.index)
          const tab = members.find((tab) => tab.active) ?? members[0]
          if (!group || !tab)
            throw new Error('This tab group is no longer available.')
          if (group.collapsed)
            await run({
              type: 'set-group-collapsed',
              groupId: group.id,
              collapsed: false,
            })
          await run({ type: 'activate-tab', tabId: tab.id })
          break
        }
        case 'window':
          await run({
            type: 'activate-window',
            windowId: action.windowId,
          })
          break
        case 'restore': {
          const restored = (options.results ?? []).filter(
            (result) => result.sessionId === action.sessionId && result.url,
          )
          if (!restored.length)
            throw new Error('This saved session is no longer available.')
          for (const result of restored)
            await run({
              type: 'create-tab',
              windowId,
              url: result.url,
            })
          break
        }
        case 'tab-manager':
          await options.onTabManager?.()
          break
        case 'options':
          await options.onOptions?.()
          break
      }
      current(operation)
      if (version === queryVersion) await clearQuery()
    },
  }
}
