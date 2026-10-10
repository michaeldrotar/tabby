import { describe, expect, it, vi } from 'vitest'
import { createChromeBackend } from './createChromeBackend.js'
import type { ChromeBackendApi } from './createChromeBackend.js'

const event = () => {
  const listeners = new Set<(...args: unknown[]) => void>()
  return {
    addListener: (listener: (...args: unknown[]) => void) =>
      listeners.add(listener),
    removeListener: (listener: (...args: unknown[]) => void) =>
      listeners.delete(listener),
    emit: (...args: unknown[]) =>
      listeners.forEach((listener) => listener(...args)),
    size: () => listeners.size,
  }
}

const deferred = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const mockBrowser = () => {
  let windows = [{ id: 1, type: 'normal', focused: true, incognito: false }]
  let tabs = [
    {
      id: 11,
      windowId: 1,
      index: 0,
      title: 'Tabby',
      url: 'https://tabby.test',
      active: true,
      groupId: 7,
      status: 'complete',
      mutedInfo: { muted: true },
    },
    {
      id: 12,
      windowId: 1,
      index: 1,
      title: 'Docs',
      url: 'https://docs.test',
      active: false,
      groupId: 7,
      status: 'loading',
    },
  ]
  let groups = [
    { id: 7, windowId: 1, title: 'Research', color: 'blue', collapsed: false },
  ]
  const onRemoved = event()
  const onUpdated = event()
  const onWindowRemoved = event()
  const api = {
    windows: {
      getAll: vi.fn(async () => structuredClone(windows)),
      onCreated: event(),
      onRemoved: onWindowRemoved,
      onFocusChanged: event(),
      onBoundsChanged: event(),
      create: vi.fn(async () => {
        const window = {
          id: 2,
          type: 'normal',
          focused: true,
          incognito: false,
        }
        windows.push(window)
        return window
      }),
      remove: vi.fn(async (id: number) => {
        windows = windows.filter((window) => window.id !== id)
        tabs = tabs.filter((tab) => tab.windowId !== id)
        groups = groups.filter((group) => group.windowId !== id)
        onWindowRemoved.emit(id)
      }),
      update: vi.fn(async (id: number) =>
        windows.find((window) => window.id === id),
      ),
    },
    tabs: {
      query: vi.fn(async () => structuredClone(tabs)),
      onCreated: event(),
      onRemoved,
      onUpdated,
      onActivated: event(),
      onHighlighted: event(),
      onMoved: event(),
      onAttached: event(),
      onDetached: event(),
      onReplaced: event(),
      remove: vi.fn(async (id: number) => {
        if (id === 99) throw new Error('Tab no longer exists.')
        tabs = tabs.filter((tab) => tab.id !== id)
        if (!tabs.length) {
          windows = []
          groups = []
          onWindowRemoved.emit(1)
        }
        onRemoved.emit(id)
      }),
      update: vi.fn(async (id: number) => tabs.find((tab) => tab.id === id)),
    },
    tabGroups: {
      query: vi.fn(async () => structuredClone(groups)),
      onCreated: event(),
      onUpdated: event(),
      onRemoved: event(),
      onMoved: event(),
      update: vi.fn(async (id: number, update: { collapsed: boolean }) => {
        groups = groups.map((group) =>
          group.id === id ? { ...group, ...update } : group,
        )
        api.tabGroups.onUpdated.emit()
        return groups.find((group) => group.id === id)
      }),
    },
  }
  return {
    api: api as unknown as ChromeBackendApi,
    mock: api,
    onRemoved,
    onUpdated,
  }
}

describe('Chrome browser backend', () => {
  it('normalizes records and keeps event and command results authoritative with partial close outcomes', async () => {
    const { api, mock, onUpdated } = mockBrowser()
    const backend = createChromeBackend(api)
    await backend.start()
    expect(backend.getSnapshot()).toMatchObject({
      state: 'loaded',
      tabs: [
        { id: 11, muted: true, loading: false },
        { id: 12, loading: true },
      ],
    })
    const snapshot = backend.getSnapshot()
    onUpdated.emit()
    await backend.start()
    expect(backend.getSnapshot()).toBe(snapshot)

    expect(
      await backend.execute({ type: 'close-tabs', tabIds: [11, 99, 11] }),
    ).toEqual({
      status: 'partial',
      requestedIds: [11, 99],
      succeededIds: [11],
      failures: [{ id: 99, message: 'Tab no longer exists.' }],
    })
    expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([12])
    await backend.execute({
      type: 'set-group-collapsed',
      groupId: 7,
      collapsed: true,
    })
    expect(backend.getSnapshot().groups[0]?.collapsed).toBe(true)
    await backend.execute({ type: 'close-tabs', tabIds: [12] })
    expect(backend.getSnapshot()).toMatchObject({
      windows: [],
      tabs: [],
      groups: [],
    })
    expect(mock.tabs.remove).toHaveBeenCalledTimes(3)
    backend.dispose()
    expect(mock.tabs.onRemoved.size()).toBe(0)
    expect(mock.windows.onCreated.size()).toBe(0)
    expect(mock.tabGroups.onUpdated.size()).toBe(0)
  })

  it('requeries events overlapping initial load instead of restoring a removed tab', async () => {
    const { api, mock } = mockBrowser()
    const initialTabs = deferred<Awaited<ReturnType<typeof mock.tabs.query>>>()
    mock.tabs.query.mockImplementationOnce(() => initialTabs.promise)
    const backend = createChromeBackend(api)
    const loading = backend.start()
    await mock.tabs.remove(11)
    initialTabs.resolve([
      {
        id: 11,
        windowId: 1,
        index: 0,
        title: 'Stale',
        url: 'https://stale.test',
        active: true,
        groupId: 7,
        status: 'complete',
      },
    ])
    await loading
    expect(backend.getSnapshot().tabs.map((tab) => tab.id)).toEqual([12])
    backend.dispose()
  })

  it('ignores late loads after disposal, restarts safely, and isolates subscriptions', async () => {
    const { api, mock } = mockBrowser()
    const pending = deferred<Awaited<ReturnType<typeof mock.tabs.query>>>()
    mock.tabs.query.mockImplementationOnce(() => pending.promise)
    const backend = createChromeBackend(api)
    const oldStart = backend.start()
    backend.dispose()
    await backend.start()
    const current = backend.getSnapshot()
    pending.resolve([])
    await oldStart
    expect(backend.getSnapshot()).toBe(current)
    expect(mock.tabs.onCreated.size()).toBe(1)
    backend.dispose()
    const outcome = await backend.execute({ type: 'close-tabs', tabIds: [11] })
    expect(outcome.status).toBe('failed')
    expect(mock.tabs.remove).not.toHaveBeenCalled()
  })

  it('stops the remaining batch after disposal and leaves a restarted connection authoritative', async () => {
    const { api, mock } = mockBrowser()
    const pending = deferred<void>()
    mock.tabs.remove.mockImplementationOnce(() => pending.promise)
    const backend = createChromeBackend(api)
    await backend.start()
    const closing = backend.execute({ type: 'close-tabs', tabIds: [11, 12] })
    backend.dispose()
    await backend.start()
    const current = backend.getSnapshot()
    pending.resolve()
    expect(await closing).toMatchObject({
      status: 'partial',
      succeededIds: [11],
      failures: [{ id: 12, message: 'The browser connection was stopped.' }],
    })
    expect(mock.tabs.remove).toHaveBeenCalledTimes(1)
    expect(backend.getSnapshot()).toBe(current)
    backend.dispose()
  })

  it('publishes query failures and refreshes when the connection recovers', async () => {
    const { api, mock } = mockBrowser()
    mock.windows.getAll.mockRejectedValueOnce(
      new Error('Browser disconnected.'),
    )
    const backend = createChromeBackend(api)
    await backend.start()
    expect(backend.getSnapshot()).toMatchObject({
      state: 'error',
      error: 'Browser disconnected.',
    })
    await backend.start()
    expect(backend.getSnapshot().state).toBe('loaded')
    backend.dispose()
  })
})

describe('Chrome command parity', () => {
  it('creates a focused window with the originating privacy and window settings', async () => {
    const { api } = mockBrowser()
    for (const [incognito, state] of [
      [false, 'normal'],
      [true, 'normal'],
      [true, 'maximized'],
    ] as const) {
      const source = {
        id: 1,
        incognito,
        height: 700,
        left: 100,
        state,
        top: 80,
        width: 900,
      }
      const get = vi.fn(async () => source)
      const create = vi.fn(async () => ({ id: 3 }))
      const backend = createChromeBackend({
        ...api,
        windows: { ...api.windows, get, create },
      } as unknown as ChromeBackendApi)
      await backend.start()
      expect(
        await backend.execute({
          type: 'create-window',
          sourceWindowId: 1,
        }),
      ).toMatchObject({ status: 'success', createdWindowIds: [3] })
      expect(get).toHaveBeenCalledExactlyOnceWith(1)
      expect(create).toHaveBeenCalledExactlyOnceWith({
        type: 'normal',
        url: undefined,
        focused: true,
        incognito,
        state,
        ...(state === 'normal'
          ? { height: 700, left: 100, top: 80, width: 900 }
          : {}),
      })
      backend.dispose()
    }
  })

  it('maps tab actions, ordered moves, grouping, and group metadata to injected browser APIs', async () => {
    const { api, mock } = mockBrowser()
    const reload = vi.fn(async () => {}),
      discard = vi.fn(async () => undefined),
      ungroup = vi.fn(async () => {}),
      move = vi.fn(async () => []),
      group = vi.fn(async () => 8),
      duplicate = vi.fn(async () => ({ id: 21 })),
      create = vi.fn(async () => ({ id: 22, windowId: 1 })),
      moveGroup = vi.fn(async () => ({ id: 7 }))
    const backend = createChromeBackend({
      ...api,
      tabs: {
        ...api.tabs,
        reload,
        discard,
        ungroup,
        move,
        group,
        duplicate,
        create,
      },
      tabGroups: { ...api.tabGroups!, move: moveGroup },
    } as unknown as ChromeBackendApi)
    await backend.start()
    await backend.execute({ type: 'create-tab', groupId: 7 })
    expect(create).toHaveBeenCalledExactlyOnceWith({
      windowId: 1,
      url: undefined,
      active: true,
      index: 2,
      openerTabId: 12,
    })
    expect(group).toHaveBeenCalledExactlyOnceWith({ tabIds: 22, groupId: 7 })
    expect(mock.windows.update).toHaveBeenCalledWith(1, { focused: true })
    group.mockClear()
    await backend.execute({
      type: 'tab-action',
      action: 'pin',
      tabIds: [11, 11, 12],
    })
    expect(mock.tabs.update.mock.calls).toEqual([
      [11, { pinned: true }],
      [12, { pinned: true }],
    ])
    await backend.execute({
      type: 'tab-action',
      action: 'reload',
      tabIds: [11],
    })
    expect(reload).toHaveBeenCalledWith(11)
    const discarded = await backend.execute({
      type: 'tab-action',
      action: 'discard',
      tabIds: [11, 12],
    })
    expect(discarded).toMatchObject({
      succeededIds: [12],
      skippedActiveIds: [11],
    })
    expect(discard).toHaveBeenCalledExactlyOnceWith(12)
    expect(
      await backend.execute({
        type: 'tab-action',
        action: 'duplicate',
        tabIds: [12],
      }),
    ).toMatchObject({ createdTabIds: [21] })
    await backend.execute({ type: 'group-tabs', tabIds: [11, 12] })
    expect(group.mock.calls).toEqual([
      [{ tabIds: 11, createProperties: { windowId: 1 } }],
      [{ tabIds: 12, groupId: 8 }],
    ])
    await backend.execute({
      type: 'group-action',
      groupIds: [7],
      action: { type: 'rename', title: 'Docs' },
    })
    expect(mock.tabGroups.update).toHaveBeenCalledWith(7, { title: 'Docs' })
    await backend.execute({
      type: 'move-tab',
      tabId: 11,
      direction: 'backward',
    })
    expect(ungroup).toHaveBeenCalledWith(11)
    const moved = await backend.execute({ type: 'move-tabs', tabIds: [11, 12] })
    expect(moved).toMatchObject({
      createdWindowIds: [2],
      succeededIds: [11, 12],
    })
    expect(mock.windows.create).toHaveBeenCalledWith({
      tabId: 11,
      type: 'normal',
      incognito: false,
    })
    expect(move).toHaveBeenCalledWith(12, { windowId: 2, index: -1 })
    await backend.execute({ type: 'move-group', groupId: 7 })
    expect(moveGroup).toHaveBeenCalledWith(7, { windowId: 2, index: -1 })
    backend.dispose()
  })
})

describe('browser presentation facts', () => {
  it('retains loaded content and render identity across reloads and replaced Chrome tab IDs', async () => {
    const { api, mock } = mockBrowser()
    const backend = createChromeBackend(api)
    await backend.start()
    const first = await mock.tabs.query()
    mock.tabs.query.mockResolvedValueOnce(
      first.map((tab) => (tab.id === 11 ? { ...tab, status: 'loading' } : tab)),
    )
    mock.tabs.onUpdated.emit()
    await backend.start()
    expect(backend.getSnapshot().tabs[0]).toMatchObject({
      id: 11,
      loading: true,
      hasLoaded: true,
      renderKey: 11,
    })
    mock.tabs.query.mockResolvedValueOnce(
      first.map((tab) =>
        tab.id === 11 ? { ...tab, id: 21, status: 'loading' } : tab,
      ),
    )
    mock.tabs.onReplaced.emit(21, 11)
    await backend.start()
    expect(backend.getSnapshot().tabs[0]).toMatchObject({
      id: 21,
      loading: true,
      hasLoaded: true,
      renderKey: 11,
    })
    backend.dispose()
  })
})
