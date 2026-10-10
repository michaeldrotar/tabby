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
