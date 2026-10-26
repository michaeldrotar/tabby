import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { flattenBookmarks } from '@extension/core/bookmarks'
import { describe, expect, it, vi } from 'vitest'
import { createChromeBookmarkResource } from './createChromeBookmarkResource.js'
import type { BookmarkNode } from '@extension/core/bookmarks'

const source = readFileSync(
  new URL('../../../scripts/preview/mock-chrome.js', import.meta.url),
  'utf8',
)
const fixture = JSON.parse(
  readFileSync(
    new URL('../../../scripts/preview/browser-data.json', import.meta.url),
    'utf8',
  ),
)
const setup = async () => {
  const context = {
    __TABBY_PREVIEW__: { browser: fixture, messages: {}, platform: 'linux' },
    structuredClone,
    URL,
    chrome: undefined as unknown as typeof chrome,
  }
  runInNewContext(source, context)
  const api = context.chrome
  const resource = createChromeBookmarkResource(api)
  await resource.start()
  const node = (id: string) =>
    flattenBookmarks(resource.getSnapshot().roots).find(
      (node) => node.id === id,
    )!
  return { api, resource, node }
}

describe('native bookmark resource', () => {
  it('creates duplicate names, edits, reorders in both directions, moves, and follows external changes', async () => {
    const { api, resource, node } = await setup()
    await resource.create('1', 'Reading list')
    expect(
      node('1').children?.filter((node) => node.title === 'Reading list'),
    ).toHaveLength(3)
    await resource.create('10', 'New link', 'https://example.com/new')
    const created = node('10').children!.at(-1)!
    await resource.update(created.id, 'Renamed', 'https://example.com/edited')
    await resource.move(created.id, '10', 0)
    expect(node('10').children![0]?.title).toBe('Renamed')
    await resource.move(created.id, '10', 2)
    expect(node('10').children![2]?.title).toBe('Renamed')
    await resource.move(created.id, '2')
    expect(node('2').children![0]?.url).toBe('https://example.com/edited')
    await resource.selectFolder('10')
    await api.bookmarks.removeTree('10')
    await vi.waitFor(() => expect(resource.getSnapshot().folderId).toBe('0'))
    await resource.remove(created.id)
    expect(node('2').children).toHaveLength(0)
    const stored = await api.storage.local.get(null)
    expect(stored['tabby-bookmark-sidebar']).toEqual({ folderId: '10' })
    resource.dispose()
  })

  it('protects special roots and managed items and rejects cycles and executable addresses', async () => {
    const { resource } = await setup()
    await expect(resource.update('1', 'New name')).rejects.toThrow(
      'Chrome manages',
    )
    await expect(resource.remove('30')).rejects.toThrow('Chrome manages')
    await expect(resource.create('3', 'New item')).rejects.toThrow('writable')
    await expect(resource.move('10', '15')).rejects.toThrow('itself')
    await expect(
      resource.create('1', 'Script', 'javascript:alert(1)'),
    ).rejects.toThrow('cannot be saved')
    resource.dispose()
  })

  it.each(['tabs', 'window', 'group'] as const)(
    'opens only direct children into %s',
    async (destination) => {
      const { api, resource } = await setup()
      const before = (await api.tabs.query({})).map((tab) => tab.id)
      await resource.openFolder('10', destination, 1)
      const created = (await api.tabs.query({})).filter(
        (tab) => !before.includes(tab.id),
      )
      expect(created.map((tab) => tab.url)).toEqual([
        'https://github.com/michaeldrotar/tabby',
        'https://developer.chrome.com/docs/extensions/',
      ])
      expect(created[0]?.windowId === 1).toBe(destination !== 'window')
      expect(created[0]?.groupId !== -1).toBe(destination === 'group')
      resource.dispose()
    },
  )

  it('maps a folder structure to windows and flattens deep descendants into the nearest group', async () => {
    const { api, resource } = await setup()
    await resource.openFolder('10', 'structure', 1)
    const newWindows = (await api.windows.getAll()).filter(
      (window) => window.id! > fixture.windows.length,
    )
    expect(newWindows).toHaveLength(2)
    const tabs = await api.tabs.query({ windowId: newWindows[1]!.id })
    expect(tabs.map((tab) => tab.url)).toEqual([
      'https://developer.chrome.com/docs/extensions/reference/api/bookmarks',
      'https://www.w3.org/WAI/',
    ])
    expect(tabs.map((tab) => tab.groupId === -1)).toEqual([true, false])
    resource.dispose()
  })

  it('saves and restores multiple groups without merging duplicate labels, keeping colors and tab order', async () => {
    const { api, resource, node } = await setup()
    const [first, second] = await api.tabs.query({ windowId: 1 })
    const groupId = await api.tabs.group({
      tabIds: [first!.id!, second!.id!],
      createProperties: { windowId: 1 },
    })
    await api.tabGroups.update(groupId, { title: 'Tabby', color: 'orange' })
    const originalTabs = await api.tabs.query({ windowId: 1 })
    const originalGroups = await api.tabGroups.query({ windowId: 1 })
    await resource.saveWindow(1, '2', 'Saved window')
    const saved = node('2').children![0]!
    await resource.openFolder(saved.id, 'restore', 1)
    const restoredWindow = (await api.windows.getAll()).at(-1)!
    const restoredTabs = await api.tabs.query({ windowId: restoredWindow.id })
    expect(restoredTabs.map((tab) => tab.url)).toEqual(
      originalTabs.map((tab) => tab.url),
    )
    const restoredGroups = await api.tabGroups.query({
      windowId: restoredWindow.id,
    })
    const labels = (
      tabs: chrome.tabs.Tab[],
      groups: chrome.tabGroups.TabGroup[],
    ) =>
      tabs.map((tab) => {
        const group = groups.find((group) => group.id === tab.groupId)
        return group ? { title: group.title, color: group.color } : undefined
      })
    expect(labels(restoredTabs, restoredGroups)).toEqual(
      labels(originalTabs, originalGroups),
    )
    resource.dispose()
  })

  it('reports skipped/rejected addresses on open and rolls back a rejected window save', async () => {
    const { api, resource, node } = await setup()
    const nativeCreate = api.tabs.create.bind(api.tabs)
    vi.spyOn(api.tabs, 'create').mockImplementation(async (options) => {
      if (options.url?.includes('github.com'))
        throw new Error('Chrome rejected the address')
      return nativeCreate(options)
    })
    expect(await resource.openFolder('10', 'tabs', 1)).toContain('Skipped 1')
    const nativeBookmark = api.bookmarks.create.bind(api.bookmarks)
    vi.spyOn(api.bookmarks, 'create').mockImplementation(async (options) => {
      if (options.url) throw new Error('Chrome rejected the bookmark')
      return nativeBookmark(options)
    })
    await expect(resource.saveWindow(1, '2', 'Save')).rejects.toThrow(
      'No new entries were kept',
    )
    expect(node('2').children).toHaveLength(0)
    resource.dispose()
  })

  it('does not publish an in-flight read after disposal and reloads the saved folder on restart', async () => {
    const { api, resource } = await setup()
    await resource.selectFolder('10')
    let resolve!: (nodes: BookmarkNode[]) => void
    vi.spyOn(api.bookmarks, 'getTree').mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const pending = resource.create('2', 'Pending')
    resource.dispose()
    resolve(await api.bookmarks.getTree())
    await pending
    const next = createChromeBookmarkResource(api)
    await next.start()
    expect(next.getSnapshot().folderId).toBe('10')
    next.dispose()
  })
})

it('opens a mixed bookmark selection in one group, deduplicating direct children and reporting unsupported addresses', async () => {
  const { api, resource } = await setup()
  await api.bookmarks.create({
    parentId: '10',
    title: 'Bookmarklet',
    url: 'javascript:alert(1)',
  })
  const before = (await api.tabs.query({})).map((tab) => tab.id)
  const result = await resource.openItems(['10', '11', '14'], 'group', 1)
  const created = (await api.tabs.query({})).filter(
    (tab) => !before.includes(tab.id),
  )
  expect(created.map((tab) => tab.url)).toEqual([
    'https://github.com/michaeldrotar/tabby',
    'https://developer.chrome.com/docs/extensions/',
    'https://developer.chrome.com/docs/extensions/reference/api/bookmarks',
  ])
  expect(new Set(created.map((tab) => tab.groupId)).size).toBe(1)
  expect(created[0]?.groupId).not.toBe(-1)
  expect(result).toContain('Opened 3 tabs')
  expect(result).toContain('Skipped 1')
  resource.dispose()
})
