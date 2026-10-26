import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { findBookmark } from '@extension/core/bookmarks'
import { describe, expect, it, vi } from 'vitest'
import { createChromeBookmarks } from './createChromeBookmarks.js'

const mock = readFileSync(
  new URL('../../../scripts/preview/mock-chrome.js', import.meta.url),
  'utf8',
)
const setup = () => {
  const context = {
    __TABBY_PREVIEW__: {
      messages: {},
      platform: 'linux',
      browser: {
        currentWindowId: 1,
        windows: [{ id: 1, focused: true }, { id: 2 }],
        groups: [],
        tabs: [
          {
            id: 1,
            windowId: 1,
            title: 'App one',
            url: 'http://localhost:3000/one',
            active: true,
          },
          {
            id: 2,
            windowId: 1,
            title: 'App two',
            url: 'http://localhost:3001/two',
          },
          {
            id: 3,
            windowId: 2,
            title: 'Other window',
            url: 'https://example.com/',
          },
        ],
        bookmarks: [
          {
            id: '0',
            title: '',
            children: [
              {
                id: '1',
                title: 'Bookmarks bar',
                children: [
                  {
                    id: '10',
                    title: 'Favorites',
                    children: [
                      {
                        id: '11',
                        title: 'App one',
                        url: 'http://localhost:3000/one',
                      },
                      {
                        id: '12',
                        title: 'Other app',
                        url: 'http://localhost:3000/two',
                      },
                      {
                        id: '13',
                        title: 'Example',
                        url: 'https://example.com/',
                      },
                      { id: '14', title: 'Unsafe', url: 'javascript:alert(1)' },
                    ],
                  },
                ],
              },
              {
                id: '2',
                title: 'Other bookmarks',
                children: [{ id: '20', title: 'Favorites', children: [] }],
              },
            ],
          },
        ],
      },
    },
    structuredClone,
    URL,
    console,
    location: { origin: 'http://localhost:5199' },
    chrome: undefined as unknown as typeof chrome,
  }
  runInNewContext(mock, context)
  const api = context.chrome
  const resource = createChromeBookmarks(api)
  return { api, resource }
}

describe('native bookmark favorites', () => {
  it('tracks native identities and order across rename, move, removal, and import events without creating folders', async () => {
    const { api, resource } = setup()
    const created = vi.spyOn(api.bookmarks, 'create')
    await resource.start()
    const folder = () => findBookmark(resource.getSnapshot().roots, '10')
    expect(created).not.toHaveBeenCalled()
    expect(folder()?.children?.map((node) => node.id)).toEqual([
      '11',
      '12',
      '13',
      '14',
    ])
    await api.bookmarks.update('10', { title: 'Renamed' })
    await api.bookmarks.move('10', { parentId: '2' })
    await api.bookmarks.move('13', { parentId: '10', index: 0 })
    await vi.waitFor(() => {
      expect(folder()?.title).toBe('Renamed')
      expect(folder()?.children?.map((node) => node.id)).toEqual([
        '13',
        '11',
        '12',
        '14',
      ])
    })
    await api.bookmarks.removeTree('10')
    await resource.refresh()
    expect(folder()).toBeUndefined()
    expect(findBookmark(resource.getSnapshot().roots, '20')?.title).toBe(
      'Favorites',
    )
    const id = await resource.createFolder()
    expect((await api.bookmarks.get(id))[0]).toMatchObject({
      title: 'Tabby Favorites',
      parentId: '2',
    })
    resource.dispose()
  })

  it('adds the current native tab once, removes bookmarks, and recovers after rejected writes', async () => {
    const { api, resource } = setup()
    await resource.start()
    expect(await resource.addCurrentTab('10', 1)).toBe(false)
    expect(
      await Promise.all([
        resource.addCurrentTab('20', 1),
        resource.addCurrentTab('20', 1),
      ]),
    ).toEqual([true, false])
    const [saved] = await api.bookmarks.getChildren('20')
    expect(saved).toMatchObject({
      title: 'App one',
      url: 'http://localhost:3000/one',
    })
    await expect(resource.remove('20')).rejects.toThrow(
      'Only individual bookmarks',
    )
    await resource.remove(saved!.id)
    expect(await api.bookmarks.getChildren('20')).toEqual([])
    await api.tabs.update(1, { url: 'javascript:alert(1)' })
    await expect(resource.addCurrentTab('20', 1)).rejects.toThrow(
      'cannot be bookmarked',
    )
    expect(await api.bookmarks.getChildren('20')).toEqual([])
    resource.dispose()
  })

  it('opens exact URL matches only in the current window and honors fresh-tab and window modes', async () => {
    const { api, resource } = setup()
    await resource.start()
    await resource.open('11', 'default', 1)
    expect((await api.tabs.query({ windowId: 1, active: true }))[0]?.id).toBe(1)
    expect(await api.tabs.query({ windowId: 1 })).toHaveLength(2)
    await resource.open('12', 'default', 1)
    expect((await api.tabs.query({ windowId: 1, active: true }))[0]?.url).toBe(
      'http://localhost:3000/two',
    )
    await resource.open('13', 'default', 1)
    expect(await api.tabs.query({ windowId: 1 })).toHaveLength(4)
    await resource.open('11', 'new-tab', 1)
    expect((await api.tabs.query({ windowId: 1 })).at(-1)).toMatchObject({
      url: 'http://localhost:3000/one',
      active: false,
    })
    await resource.open('11', 'new-window', 1)
    expect(await api.windows.getAll()).toHaveLength(3)
    await expect(resource.open('14', 'default', 1)).rejects.toThrow(
      'cannot be opened',
    )
    expect(await api.tabs.query({})).toHaveLength(7)
    await resource.openManager('10')
    expect(
      (await api.tabs.query({})).some(
        (tab) => tab.url === 'chrome://bookmarks/?id=10',
      ),
    ).toBe(true)
    resource.dispose()
  })

  it('retries read errors, ignores stale loads, and disconnects native events on disposal', async () => {
    const { api, resource } = setup()
    const tree = await api.bookmarks.getTree()
    const getTree = vi.spyOn(api.bookmarks, 'getTree')
    getTree.mockRejectedValueOnce(new Error('Bookmarks unavailable'))
    await resource.start()
    expect(resource.getSnapshot()).toMatchObject({
      state: 'error',
      error: 'Bookmarks unavailable',
    })
    await resource.refresh()
    expect(resource.getSnapshot().state).toBe('loaded')
    let finish!: (tree: chrome.bookmarks.BookmarkTreeNode[]) => void
    getTree.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const loading = resource.refresh()
    await api.bookmarks.update('10', { title: 'Synced folder' })
    finish(tree)
    await loading
    expect(findBookmark(resource.getSnapshot().roots, '10')?.title).toBe(
      'Synced folder',
    )
    getTree.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const disposedLoad = resource.refresh()
    const previous = resource.getSnapshot()
    resource.dispose()
    finish(tree)
    await disposedLoad
    expect(resource.getSnapshot()).toBe(previous)
    const calls = getTree.mock.calls.length
    await api.bookmarks.update('10', { title: 'After dispose' })
    expect(getTree.mock.calls).toHaveLength(calls)
    await expect(resource.createFolder()).rejects.toThrow('not running')
  })
})
