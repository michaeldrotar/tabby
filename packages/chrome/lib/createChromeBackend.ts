import { getCommandTargetIds } from '@extension/core/commands'
import type {
  BrowserBackend,
  BrowserCommand,
  BrowserSnapshot,
  BrowserTab,
  BrowserTabGroup,
  BrowserWindow,
  CommandOutcome,
} from '@extension/core/browser'

export type ChromeBackendApi = Pick<typeof chrome, 'windows' | 'tabs'> & {
  tabGroups?: typeof chrome.tabGroups
}

const hasId = <T extends { id?: number }>(
  value: T,
): value is T & { id: number } => typeof value.id === 'number' && value.id >= 0

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const normalizeSnapshot = (
  windows: chrome.windows.Window[],
  tabs: chrome.tabs.Tab[],
  groups: chrome.tabGroups.TabGroup[],
): Pick<BrowserSnapshot, 'windows' | 'tabs' | 'groups'> => {
  const browserWindows: BrowserWindow[] = windows
    .filter(hasId)
    .filter((window) => window.type === 'normal')
    .map(({ id, type, incognito, focused }) => ({
      id,
      type,
      incognito,
      focused,
    }))
    .sort((a, b) => a.id - b.id)
  const windowIds = new Set(browserWindows.map((window) => window.id))
  const browserTabs: BrowserTab[] = tabs
    .filter(hasId)
    .filter((tab) => windowIds.has(tab.windowId))
    .map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      index: tab.index,
      title: tab.title ?? '',
      url: tab.url,
      active: tab.active,
      pinned: tab.pinned,
      discarded: tab.discarded,
      loading: tab.status === 'loading',
      audible: tab.audible,
      muted: tab.mutedInfo?.muted,
      faviconUrl: tab.favIconUrl,
      lastAccessed: tab.lastAccessed,
      groupId: tab.groupId >= 0 ? tab.groupId : undefined,
    }))
    .sort((a, b) => a.windowId - b.windowId || a.index - b.index)
  const browserGroups: BrowserTabGroup[] = groups
    .filter(hasId)
    .filter((group) => windowIds.has(group.windowId))
    .map(({ id, windowId, title, color, collapsed }) => ({
      id,
      windowId,
      title,
      color,
      collapsed,
    }))
    .sort((a, b) => a.id - b.id)
  return { windows: browserWindows, tabs: browserTabs, groups: browserGroups }
}

export const createChromeBackend = (api: ChromeBackendApi): BrowserBackend => {
  let snapshot: BrowserSnapshot = {
    state: 'loading',
    revision: 0,
    windows: [],
    tabs: [],
    groups: [],
  }
  const subscribers = new Set<() => void>()
  let generation = 0
  let running = false
  let eventRevision = 0
  let refreshTask: Promise<void> | undefined
  let removeListeners: (() => void)[] = []

  const publish = (next: Omit<BrowserSnapshot, 'revision'>): void => {
    const { revision: _revision, ...previous } = snapshot
    if (JSON.stringify(previous) === JSON.stringify(next)) return
    snapshot = { ...next, revision: snapshot.revision + 1 }
    subscribers.forEach((listener) => listener())
  }

  const refresh = (): Promise<void> => {
    if (!running) return Promise.resolve()
    if (refreshTask) return refreshTask
    const currentGeneration = generation
    const task = (async () => {
      let observedRevision: number
      do {
        observedRevision = eventRevision
        try {
          const [windows, tabs, groups] = await Promise.all([
            api.windows.getAll({ windowTypes: ['normal'] }),
            api.tabs.query({}),
            api.tabGroups?.query({}) ?? Promise.resolve([]),
          ])
          if (!running || generation !== currentGeneration) return
          // An event during a query may make its records stale. Requery before
          // publishing so removed records cannot be resurrected on initial load.
          if (observedRevision !== eventRevision) continue
          publish({
            state: 'loaded',
            ...normalizeSnapshot(windows, tabs, groups),
          })
        } catch (error) {
          if (!running || generation !== currentGeneration) return
          if (observedRevision !== eventRevision) continue
          publish({
            state: 'error',
            windows: snapshot.windows,
            tabs: snapshot.tabs,
            groups: snapshot.groups,
            error: errorMessage(error),
          })
        }
      } while (observedRevision !== eventRevision)
    })()
    refreshTask = task
    void task.finally(() => {
      if (refreshTask === task) refreshTask = undefined
    })
    return task
  }

  const invalidate = (): Promise<void> => {
    eventRevision += 1
    return refresh()
  }

  const start = (): Promise<void> => {
    if (running) return refresh()
    running = true
    generation += 1
    const currentGeneration = generation
    const onChange = () => {
      if (running && generation === currentGeneration) void invalidate()
    }
    const events = [
      api.windows.onCreated,
      api.windows.onRemoved,
      api.windows.onFocusChanged,
      api.windows.onBoundsChanged,
      api.tabs.onCreated,
      api.tabs.onRemoved,
      api.tabs.onUpdated,
      api.tabs.onActivated,
      api.tabs.onHighlighted,
      api.tabs.onMoved,
      api.tabs.onAttached,
      api.tabs.onDetached,
      api.tabs.onReplaced,
      api.tabGroups?.onCreated,
      api.tabGroups?.onRemoved,
      api.tabGroups?.onUpdated,
      api.tabGroups?.onMoved,
    ]
    events.forEach((event) => {
      if (!event) return
      event.addListener(onChange)
      removeListeners.push(() => event.removeListener(onChange))
    })
    return invalidate()
  }

  const execute = async (command: BrowserCommand): Promise<CommandOutcome> => {
    const commandGeneration = generation
    const requestedIds = getCommandTargetIds(command)
    const succeededIds: number[] = []
    const failures: { id: number; message: string }[] = []
    let createdWindowIds: number[] | undefined
    let createdTabIds: number[] | undefined
    const attempt = async (id: number, operation: () => Promise<unknown>) => {
      try {
        if (!running || generation !== commandGeneration) {
          throw new Error('The browser connection was stopped.')
        }
        await operation()
        succeededIds.push(id)
      } catch (error) {
        failures.push({ id, message: errorMessage(error) })
      }
    }

    if (!running) {
      return {
        status: 'failed',
        requestedIds,
        succeededIds,
        failures: (requestedIds.length ? requestedIds : [-1]).map((id) => ({
          id,
          message: 'The browser connection is not running.',
        })),
      }
    }

    switch (command.type) {
      case 'create-window':
        try {
          const window = await api.windows.create({ type: 'normal' })
          if (!window || !hasId(window)) {
            throw new Error('Chrome did not return the created window.')
          }
          createdWindowIds = [window.id]
          createdTabIds = window.tabs?.filter(hasId).map((tab) => tab.id)
        } catch (error) {
          failures.push({ id: -1, message: errorMessage(error) })
        }
        break
      case 'close-tabs':
        for (const id of requestedIds) {
          await attempt(id, () => api.tabs.remove(id))
        }
        break
      case 'close-window':
        await attempt(command.windowId, () =>
          api.windows.remove(command.windowId),
        )
        break
      case 'activate-tab':
        await attempt(command.tabId, async () => {
          const tab = await api.tabs.update(command.tabId, { active: true })
          if (!tab) throw new Error('Chrome did not return the activated tab.')
          if (!running || generation !== commandGeneration) {
            throw new Error('The browser connection was stopped.')
          }
          await api.windows.update(tab.windowId, { focused: true })
        })
        break
      case 'activate-window':
        await attempt(command.windowId, () =>
          api.windows.update(command.windowId, { focused: true }),
        )
        break
      case 'set-group-collapsed':
        await attempt(command.groupId, () => {
          if (!api.tabGroups) {
            throw new Error('Tab groups are unavailable in this browser.')
          }
          return api.tabGroups.update(command.groupId, {
            collapsed: command.collapsed,
          })
        })
        break
    }
    if (running && generation === commandGeneration) await invalidate()
    return {
      status: failures.length
        ? succeededIds.length
          ? 'partial'
          : 'failed'
        : 'success',
      requestedIds,
      succeededIds,
      failures,
      ...(createdWindowIds ? { createdWindowIds } : {}),
      ...(createdTabIds ? { createdTabIds } : {}),
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      subscribers.add(listener)
      return () => subscribers.delete(listener)
    },
    start,
    execute,
    dispose: () => {
      running = false
      generation += 1
      refreshTask = undefined
      removeListeners.forEach((remove) => remove())
      removeListeners = []
    },
  }
}
