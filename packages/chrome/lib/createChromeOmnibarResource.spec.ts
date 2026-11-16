import { describe, expect, it, vi } from 'vitest'
import { createChromeOmnibarResource } from './createChromeOmnibarResource.js'
import type { ChromeOmnibarApi } from './createChromeOmnibarResource.js'

const setup = (originalWindowId?: number) => {
  const api = {
    tabs: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      query: vi.fn().mockResolvedValue([{ id: 7, index: 0 }]),
    },
    windows: {
      create: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      getLastFocused: vi.fn().mockResolvedValue({ id: 3 }),
    },
    tabGroups: {
      query: vi
        .fn()
        .mockResolvedValue([{ id: 20, windowId: 4, collapsed: true }]),
      update: vi.fn().mockResolvedValue({}),
    },
    history: {
      search: vi.fn().mockResolvedValue([
        {
          id: 'h',
          title: 'Tabby History',
          url: 'https://tabby.test',
          lastVisitTime: 1000,
        },
      ]),
    },
    bookmarks: {
      getTree: vi.fn().mockResolvedValue([
        {
          id: 'recent-bookmark',
          title: 'Recent bookmark',
          url: 'https://recent.test',
        },
      ]),
      search: vi.fn().mockResolvedValue([
        { id: 'folder', title: 'Folder' },
        { id: 'b', title: 'Tabby Bookmark', url: 'https://tabby.test' },
      ]),
    },
    sessions: {
      getRecentlyClosed: vi.fn().mockResolvedValue([
        {
          lastModified: 2,
          window: {
            sessionId: 'closed',
            tabs: [
              { title: 'Tabby closed', url: 'https://tabby.test' },
              { title: 'Unrelated', url: 'https://other.test' },
            ],
          },
        },
      ]),
      restore: vi.fn().mockResolvedValue({}),
    },
    storage: {
      session: {
        get: vi.fn().mockResolvedValue({}),
        remove: vi.fn().mockResolvedValue(undefined),
      },
      local: {
        get: vi.fn().mockResolvedValue({ lastQuery: 'saved' }),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      getPlatformInfo: vi.fn().mockResolvedValue({ os: 'mac' }),
      openOptionsPage: vi.fn().mockResolvedValue(undefined),
    },
    commands: {
      getAll: vi
        .fn()
        .mockResolvedValue([
          { name: 'open-tab-manager', shortcut: 'Alt+Shift+E' },
        ]),
    },
    sidePanel: { open: vi.fn().mockResolvedValue(undefined) },
  }
  return {
    api,
    resource: createChromeOmnibarResource(
      api as unknown as ChromeOmnibarApi,
      originalWindowId,
    ),
  }
}

describe('Chrome Omnibar resource', () => {
  it('matches recently closed URL substrings and preserves native search results', async () => {
    const { api, resource } = setup()
    await resource.start()
    const results = await resource.search('e')
    expect(results.map((item) => item.type)).toEqual([
      'recently-closed',
      'recently-closed',
      'bookmark',
      'history',
    ])
    expect(api.bookmarks.search).toHaveBeenCalledWith('e')
    expect(api.history.search).toHaveBeenCalledWith({
      text: 'e',
      maxResults: 50,
      startTime: 0,
    })
  })

  it('focuses a window without changing its active tab or opening a copy', async () => {
    const { api, resource } = setup(1)
    await resource.start()
    await resource.execute({ kind: 'window', windowId: 4 }, 'new-window')
    expect(api.windows.update).toHaveBeenCalledWith(4, { focused: true })
    expect(api.tabs.update).not.toHaveBeenCalled()
    expect(api.tabs.create).not.toHaveBeenCalled()
    expect(api.windows.create).not.toHaveBeenCalled()
  })
  it('rejects executable bookmark URLs without changing a browser tab', async () => {
    const { api, resource } = setup()
    await resource.start()
    await expect(
      resource.execute({ kind: 'url', url: 'javascript:alert(1)' }),
    ).rejects.toThrow('This URL cannot be opened')
    expect(api.tabs.update).not.toHaveBeenCalled()
    expect(api.tabs.create).not.toHaveBeenCalled()
    expect(resource.getSnapshot().initialQuery).toBe('saved')
  })
  it('loads host metadata, searches all sources, restores windows and preserves query ordering', async () => {
    const { api, resource } = setup()
    const initial = resource.getSnapshot()
    await resource.start()
    expect(resource.getSnapshot()).toEqual({
      loaded: true,
      initialQuery: 'saved',
      initialScope: 'all',
      originalWindowId: 3,
      isMac: true,
      choices: [],
      openTabManagerShortcut: 'Alt+Shift+E',
    })
    expect(initial.loaded).toBe(false)
    const results = await resource.search('tabby')
    expect(results.map((result) => result.type)).toEqual([
      'recently-closed',
      'bookmark',
      'history',
    ])
    expect(results[0]).toMatchObject({
      tabCount: 2,
      action: { kind: 'restore', sessionId: 'closed' },
      lastVisitTime: 2000,
    })
    await resource.execute(results[0]!.action, 'new-window')
    expect(api.sessions.restore).toHaveBeenCalledWith('closed')
    await Promise.all([
      resource.saveQuery('one'),
      resource.saveQuery('two'),
      resource.clearQuery(),
    ])
    expect(api.storage.local.set.mock.calls).toEqual([
      [{ lastQuery: 'one', lastScope: 'all' }],
      [{ lastQuery: 'two', lastScope: 'all' }],
    ])
    expect(api.storage.local.remove).toHaveBeenCalledWith([
      'lastQuery',
      'lastScope',
    ])
    const opening = resource.execute({ kind: 'tab-manager' })
    expect(api.sidePanel.open).toHaveBeenCalledWith({ windowId: 3 })
    await opening
  })

  it('routes default and modified results to their correct windows and falls back to existing restricted tabs', async () => {
    const { api, resource } = setup(1)
    await resource.start()
    const action = {
      kind: 'tab' as const,
      tabId: 9,
      windowId: 4,
      url: 'http://localhost:3000',
    }
    await resource.execute(action)
    expect(api.tabs.update).toHaveBeenCalledWith(9, { active: true })
    expect(api.windows.update).toHaveBeenLastCalledWith(4, { focused: true })
    await resource.execute(action, 'new-tab')
    expect(api.tabs.create).toHaveBeenCalledWith({
      windowId: 1,
      url: action.url,
      active: true,
    })
    await resource.execute(action, 'new-window')
    expect(api.windows.create).toHaveBeenCalledWith({
      url: action.url,
      focused: true,
    })
    api.tabs.create.mockRejectedValueOnce(new Error('Restricted URL'))
    await resource.execute(action, 'new-tab')
    expect(api.tabs.update).toHaveBeenLastCalledWith(9, { active: true })
    await resource.execute({ kind: 'url', url: 'https://new.test' })
    expect(api.tabs.query).toHaveBeenLastCalledWith({
      windowId: 1,
      active: true,
    })
    expect(api.tabs.update).toHaveBeenLastCalledWith(7, {
      url: 'https://new.test',
      active: true,
    })
  })

  it('expands and activates groups before focusing their window, tolerates unavailable search sources, and cancels late startup', async () => {
    const { api, resource } = setup(1)
    await resource.start()
    await resource.execute({ kind: 'group', groupId: 20 })
    expect(api.tabGroups.update).toHaveBeenCalledWith(20, { collapsed: false })
    expect(api.tabs.update).toHaveBeenCalledWith(7, { active: true })
    expect(api.tabs.update.mock.invocationCallOrder[0]).toBeLessThan(
      api.windows.update.mock.invocationCallOrder[0]!,
    )
    api.bookmarks.search.mockRejectedValueOnce(new Error('Unavailable'))
    expect(
      (await resource.search('tabby')).map((result) => result.type),
    ).toEqual(['recently-closed', 'history'])
    let resolve!: (value: { lastQuery: string }) => void
    const late = setup()
    late.api.storage.local.get.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      }),
    )
    const start = late.resource.start()
    late.resource.dispose()
    resolve({ lastQuery: 'late' })
    await start
    expect(late.resource.getSnapshot().loaded).toBe(false)
    await expect(late.resource.execute({ kind: 'options' })).rejects.toThrow(
      'disposed',
    )
  })
  it('settles query writes before navigation and restores a failed activation without overwriting newer edits', async () => {
    const { api, resource } = setup(1)
    await resource.start()
    let persisted: string | undefined = 'saved'
    api.storage.local.set.mockImplementation(
      async ({ lastQuery }: { lastQuery: string }) => {
        persisted = lastQuery
      },
    )
    let finishClear!: () => void
    api.storage.local.remove.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishClear = () => {
            persisted = undefined
            resolve()
          }
        }),
    )
    const opening = resource.execute({ kind: 'window', windowId: 4 })
    await vi.waitFor(() => expect(finishClear).toBeDefined())
    expect(api.windows.update).not.toHaveBeenCalled()
    const saving = resource.saveQuery('newer edit')
    finishClear()
    await Promise.all([opening, saving])
    expect(persisted).toBe('newer edit')
    expect(api.storage.local.set.mock.invocationCallOrder.at(-1)).toBeLessThan(
      api.windows.update.mock.invocationCallOrder[0]!,
    )
    await resource.saveQuery('retry query')
    api.windows.update.mockRejectedValueOnce(new Error('Window closed'))
    await expect(
      resource.execute({ kind: 'window', windowId: 4 }),
    ).rejects.toThrow('Window closed')
    expect(persisted).toBe('retry query')
    api.windows.update.mockImplementationOnce(async () => {
      await resource.saveQuery('edited during activation')
      throw new Error('Window closed')
    })
    await expect(
      resource.execute({ kind: 'window', windowId: 4 }),
    ).rejects.toThrow('Window closed')
    expect(persisted).toBe('edited during activation')
  })
  it('does not resume group activation after the resource is disposed and restarted', async () => {
    const { api, resource } = setup(1)
    await resource.start()
    let release!: () => void
    api.tabGroups.update.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({})
        }),
    )
    const pending = resource.execute({ kind: 'group', groupId: 20 })
    const cancelled = expect(pending).rejects.toMatchObject({
      name: 'AbortError',
    })
    await vi.waitFor(() => expect(release).toBeDefined())
    resource.dispose()
    await resource.start()
    release()
    await cancelled
    expect(api.tabs.update).not.toHaveBeenCalled()
    expect(api.windows.update).not.toHaveBeenCalled()
  })
})

it('uses the window launch scope and searches only the chosen external source', async () => {
  const { api, resource } = setup(3)
  api.storage.local.get.mockResolvedValue({
    lastQuery: 'saved',
    lastScope: 'bookmarks',
  } as never)
  api.storage.session.get.mockResolvedValue({
    'tabby-search-launch-3': Date.now(),
  })
  await resource.start()
  expect(resource.getSnapshot().initialScope).toBe('current-window')
  expect(api.storage.session.remove).toHaveBeenCalledWith(
    'tabby-search-launch-3',
  )
  expect(
    (await resource.search('Tabby', 'bookmarks')).map((item) => item.type),
  ).toEqual(['bookmark'])
  expect(api.history.search).not.toHaveBeenCalled()
  expect(api.sessions.getRecentlyClosed).not.toHaveBeenCalled()
})

it.each([
  ['saved', 'bookmarks', 'bookmarks'],
  ['Work', 'windows', 'windows'],
  ['', 'bookmarks', 'all'],
  ['   ', 'history', 'all'],
  ['saved', 'invalid', 'all'],
  ['saved', undefined, 'all'],
])(
  'restores scope only with saved text (%s, %s)',
  async (lastQuery, lastScope, expected) => {
    const { api, resource } = setup()
    api.storage.local.get.mockResolvedValue({ lastQuery, lastScope } as never)
    await resource.start()
    expect(resource.getSnapshot()).toMatchObject({
      initialQuery: lastQuery,
      initialScope: expected,
    })
  },
)

it('saves criteria together, restores both after failed navigation, and clears both on success', async () => {
  const { api, resource } = setup()
  api.storage.local.get.mockResolvedValue({
    lastQuery: 'saved',
    lastScope: 'bookmarks',
  } as never)
  await resource.start()
  await resource.saveQuery('project', 'history')
  expect(api.storage.local.set).toHaveBeenLastCalledWith({
    lastQuery: 'project',
    lastScope: 'history',
  })
  api.windows.update.mockRejectedValueOnce(new Error('Window closed'))
  await expect(
    resource.execute({ kind: 'window', windowId: 3 }),
  ).rejects.toThrow('Window closed')
  expect(api.storage.local.set).toHaveBeenLastCalledWith({
    lastQuery: 'project',
    lastScope: 'history',
  })
  await resource.execute({ kind: 'window', windowId: 3 })
  expect(api.storage.local.remove).toHaveBeenLastCalledWith([
    'lastQuery',
    'lastScope',
  ])
})

it('browses recent external pages without a term and keeps All empty', async () => {
  const { api, resource } = setup()
  await resource.start()
  expect(await resource.search('', 'all')).toEqual([])
  expect(api.history.search).not.toHaveBeenCalled()
  expect(
    (await resource.search('', 'bookmarks')).map((item) => item.id),
  ).toEqual(['recent-bookmark'])
  expect(api.bookmarks.getTree).toHaveBeenCalledOnce()
  expect(api.bookmarks.search).not.toHaveBeenCalled()
  await resource.search('', 'history')
  expect(api.history.search).toHaveBeenCalledWith({
    text: '',
    maxResults: 50,
    startTime: 0,
  })
  expect(
    (await resource.search('', 'recently-closed')).every(
      (item) => item.type === 'recently-closed',
    ),
  ).toBe(true)
})

it('includes older bookmarks opened recently, falls back to save date, and caps the default list', async () => {
  const { api, resource } = setup()
  api.bookmarks.getTree.mockResolvedValue([
    {
      id: 'folder',
      title: 'Folder',
      children: [
        {
          id: 'older-used',
          title: 'Older bookmark',
          url: 'https://used.test',
          dateAdded: 1,
          dateLastUsed: 10000,
        },
        ...Array.from({ length: 60 }, (_, i) => ({
          id: `saved-${i}`,
          title: `Saved ${i}`,
          url: `https://saved-${i}.test`,
          dateAdded: i + 1,
        })),
      ],
    },
  ] as never)
  await resource.start()
  const results = await resource.search('', 'bookmarks')
  expect(results).toHaveLength(50)
  expect(results.slice(0, 2).map((item) => item.id)).toEqual([
    'older-used',
    'saved-59',
  ])
})
