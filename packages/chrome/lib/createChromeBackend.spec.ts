import { describe, expect, it, vi } from 'vitest'
import { createChromeBackend } from './createChromeBackend.js'
import { WINDOW_IDENTITIES_KEY } from './registerWindowIdentities.js'
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
  it('keeps provisional restored names and icons hidden until the match is confirmed', async () => {
    const { api } = mockBrowser()
    const identity = {
      key: 'saved-window',
      name: 'Work',
      icon: 'briefcase',
      iconColor: 'blue',
      provisional: true,
    }
    const onChanged = event()
    const storage = {
      session: {
        get: async () => ({ [WINDOW_IDENTITIES_KEY]: { 1: { ...identity } } }),
      },
      onChanged,
    } as unknown as typeof chrome.storage
    const backend = createChromeBackend({ ...api, storage })
    await backend.start()
    expect(backend.getSnapshot().windows[0]).toMatchObject({ id: 1 })
    for (const field of ['name', 'icon', 'iconColor'] as const)
      expect(backend.getSnapshot().windows[0]?.[field]).toBeUndefined()

    Object.assign(identity, {
      name: 'Research',
      icon: 'book',
      iconColor: 'green',
      provisional: false,
    })
    onChanged.emit({ [WINDOW_IDENTITIES_KEY]: {} }, 'session')
    await backend.start()
    expect(backend.getSnapshot().windows[0]).toMatchObject({
      id: 1,
      name: 'Research',
      icon: 'book',
      iconColor: 'green',
    })
    backend.dispose()
  })

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

  it('moves complete groups and individual tabs together without dissolving the groups', async () => {
    for (const destination of [2, undefined]) {
      const { api, mock } = mockBrowser()
      const query = vi.fn(async () => [
        ...(await mock.tabs.query()),
        { id: 13, windowId: 1, index: 2, groupId: -1, active: false },
      ])
      const move = vi.fn(async () => []),
        moveGroup = vi.fn(async () => ({ id: 7 }))
      const create = vi.fn(async () => ({ id: 2, tabs: [{ id: 90 }] }))
      const backend = createChromeBackend({
        ...api,
        windows: {
          ...api.windows,
          create,
          getAll: async () => [
            ...(await mock.windows.getAll()),
            { id: 2, type: 'normal', focused: false, incognito: false },
          ],
        },
        tabs: { ...api.tabs, query, move },
        tabGroups: { ...api.tabGroups!, move: moveGroup },
      } as unknown as ChromeBackendApi)
      await backend.start()
      expect(
        await backend.execute({
          type: 'move-tabs',
          tabIds: [11, 12, 13],
          windowId: destination,
        }),
      ).toMatchObject({ status: 'success', succeededIds: [11, 12, 13] })
      expect(moveGroup).toHaveBeenCalledExactlyOnceWith(7, {
        windowId: 2,
        index: -1,
      })
      expect(move).toHaveBeenCalledExactlyOnceWith(13, {
        windowId: 2,
        index: -1,
      })
      if (destination === undefined) {
        expect(create).toHaveBeenCalledExactlyOnceWith({
          type: 'normal',
          incognito: false,
          focused: false,
        })
        expect(mock.tabs.remove).toHaveBeenCalledExactlyOnceWith(90)
      } else {
        expect(create).not.toHaveBeenCalled()
        expect(mock.tabs.remove).not.toHaveBeenCalled()
      }
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
      type: 'normal',
      incognito: false,
      focused: false,
    })
    expect(moveGroup).toHaveBeenCalledWith(7, { windowId: 2, index: -1 })
    expect(move).not.toHaveBeenCalled()
    await backend.execute({ type: 'move-group', groupId: 7 })
    expect(moveGroup).toHaveBeenCalledWith(7, { windowId: 2, index: -1 })
    expect(mock.windows.create).toHaveBeenLastCalledWith({
      type: 'normal',
      incognito: false,
      focused: false,
    })
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

describe('window transfer constraints', () => {
  it('inserts pinned tabs at the pinned boundary and retains a later failed source tab without focusing Chrome', async () => {
    const { api, mock } = mockBrowser()
    let tabs = [
      {
        id: 11,
        windowId: 1,
        index: 0,
        title: 'Pinned source',
        url: 'https://source.test',
        active: true,
        pinned: true,
        groupId: -1,
      },
      {
        id: 12,
        windowId: 1,
        index: 1,
        title: 'Failed source',
        url: 'https://source.test/later',
        active: false,
        pinned: false,
        groupId: -1,
      },
      {
        id: 21,
        windowId: 2,
        index: 0,
        title: 'Pinned destination',
        url: 'https://target.test',
        active: true,
        pinned: true,
        groupId: -1,
      },
      {
        id: 22,
        windowId: 2,
        index: 1,
        title: 'Destination',
        url: 'https://target.test/later',
        active: false,
        pinned: false,
        groupId: -1,
      },
    ]
    const query = async (query: { windowId?: number; pinned?: boolean } = {}) =>
      structuredClone(
        tabs.filter(
          (tab) =>
            (query.windowId === undefined || tab.windowId === query.windowId) &&
            (query.pinned === undefined || tab.pinned === query.pinned),
        ),
      )
    const move = vi.fn(
      async (id: number, target: { windowId: number; index: number }) => {
        if (id === 12) throw new Error('Window is locked.')
        tabs = tabs.map((tab) =>
          tab.id === id
            ? { ...tab, windowId: target.windowId, index: target.index }
            : tab,
        )
      },
    )
    const backend = createChromeBackend({
      ...api,
      windows: {
        ...api.windows,
        getAll: async () => [
          { id: 1, type: 'normal', incognito: false },
          { id: 2, type: 'normal', incognito: false },
        ],
      },
      tabs: { ...api.tabs, query, move },
    } as unknown as ChromeBackendApi)
    await backend.start()
    expect(
      await backend.execute({
        type: 'move-tabs',
        tabIds: [11, 12],
        windowId: 2,
      }),
    ).toMatchObject({
      status: 'partial',
      succeededIds: [11],
      failures: [{ id: 12, message: 'Window is locked.' }],
    })
    expect(move.mock.calls).toEqual([
      [11, { windowId: 2, index: 1 }],
      [12, { windowId: 2, index: -1 }],
    ])
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 11),
    ).toMatchObject({ windowId: 2, pinned: true })
    expect(
      backend.getSnapshot().tabs.find((tab) => tab.id === 12)?.windowId,
    ).toBe(1)
    expect(mock.windows.update).not.toHaveBeenCalled()
    backend.dispose()
  })
})
