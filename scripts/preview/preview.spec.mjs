import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createPreviewServer } from './server.mjs'

const previewDirectory = import.meta.dirname
const workspace = resolve(previewDirectory, '../..')
const browser = JSON.parse(
  await readFile(resolve(previewDirectory, 'browser-data.json'), 'utf8'),
)
const messages = JSON.parse(
  await readFile(
    resolve(workspace, 'packages/i18n/locales/en/messages.json'),
    'utf8',
  ),
)
const mockSource = await readFile(
  resolve(previewDirectory, 'mock-chrome.js'),
  'utf8',
)
const loadMock = (source = mockSource, fixture = browser, environment = {}) => {
  const context = {
    ...environment,
    __TABBY_PREVIEW__: { browser: fixture, messages, platform: 'linux' },
    structuredClone,
    URL,
    console,
  }
  runInNewContext(source, context)
  return context.chrome
}

describe('full application preview', () => {
  let directory
  let server
  let origin

  beforeAll(async () => {
    const temporaryRoot = resolve(workspace, 'node_modules/.tmp')
    await mkdir(temporaryRoot, { recursive: true })
    directory = await mkdtemp(resolve(temporaryRoot, 'tabby-preview-'))
    const distDirectory = resolve(directory, 'dist')
    await mkdir(resolve(distDirectory, 'tab-manager'), { recursive: true })
    await writeFile(
      resolve(distDirectory, 'tab-manager/index.html'),
      '<html><head><script type="module" src="/app.js"></script></head><body>Real app</body></html>',
    )
    await writeFile(resolve(distDirectory, 'app.js'), 'realApplication()')
    await writeFile(resolve(directory, 'private.txt'), 'outside build output')
    server = createPreviewServer({ distDirectory })
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    origin = `http://127.0.0.1:${server.address().port}`
  })

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve))
    if (directory) await rm(directory, { recursive: true, force: true })
  })

  it('initializes Chrome before the unchanged app bundle and uses the shared fixture', async () => {
    const page = await fetch(origin)
    const html = await page.text()
    expect(page.headers.get('cache-control')).toBe('no-store')
    expect(html.indexOf('/__preview/mock-chrome.js')).toBeLessThan(
      html.indexOf('type="module"'),
    )
    const app = await fetch(`${origin}/app.js`)
    expect(await app.text()).toBe('realApplication()')
    const script = await fetch(`${origin}/__preview/mock-chrome.js`)
    const chrome = loadMock(await script.text())
    expect((await chrome.tabs.query()).map((tab) => tab.title)).toEqual(
      browser.tabs.map((tab) => tab.title),
    )
    expect((await chrome.windows.getCurrent()).id).toBe(browser.currentWindowId)
    expect((await chrome.windows.getLastFocused()).id).toBe(
      browser.windows.find((window) => window.focused)?.id ??
        browser.windows[0].id,
    )
    await chrome.windows.update(browser.windows.at(-1).id, { focused: true })
    expect((await chrome.windows.getLastFocused()).id).toBe(
      browser.windows.at(-1).id,
    )
    expect(await chrome.tabGroups.query()).toEqual(browser.groups)
    expect(chrome.i18n.getMessage('nTabs', '3')).toBe('3 tabs')
    expect(
      chrome.i18n.getMessage('toast_batchTabsActionComplete', [
        '2 tabs',
        'reloaded',
      ]),
    ).toBe('2 tabs reloaded successfully')
    expect(
      chrome.i18n.getMessage('toast_batchEntityActionComplete', [
        '2 windows closed',
      ]),
    ).toBe('2 windows closed')
  })

  it('serves only build output and returns missing or malformed paths cleanly', async () => {
    expect((await fetch(`${origin}/missing.js`)).status).toBe(404)
    expect((await fetch(`${origin}/%2e%2e%2fprivate.txt`)).status).toBe(403)
    expect((await fetch(`${origin}/%xx`)).status).toBe(400)
  })

  it('loads an alternate fixture and starts each page with fresh sample data', async () => {
    const fixturePath = resolve(directory, 'custom-browser.json')
    const custom = { ...browser, tabs: browser.tabs.slice(0, 1), groups: [] }
    await writeFile(fixturePath, JSON.stringify(custom))
    const customServer = createPreviewServer({ fixturePath })
    await new Promise((resolve) => customServer.listen(0, '127.0.0.1', resolve))
    try {
      const script = await fetch(
        `http://127.0.0.1:${customServer.address().port}/__preview/mock-chrome.js`,
      )
      const source = await script.text()
      const firstPage = loadMock(source)
      await firstPage.tabs.create({ windowId: 1 })
      expect(await firstPage.tabs.query()).toHaveLength(2)
      expect(await loadMock(source).tabs.query()).toHaveLength(1)
    } finally {
      await new Promise((resolve) => customServer.close(resolve))
    }
  })
})

describe('sample Chrome interactions', () => {
  it('keeps preview favicons stable by page URL and changes them with the URL', () => {
    const pageUrl = 'https://github.com/michaeldrotar/tabby'
    const image = {
      src: `chrome-extension://preview/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=48`,
    }
    let onMutation
    const chrome = loadMock(mockSource, browser, {
      location: { origin: 'http://localhost:5175' },
      document: {
        documentElement: {},
        querySelectorAll: () =>
          image.src.startsWith('chrome-extension://preview/_favicon/')
            ? [image]
            : [],
      },
      MutationObserver: class {
        constructor(callback) {
          onMutation = callback
        }

        observe() {}
      },
    })

    expect(chrome.runtime.getURL('tab-manager/index.html')).toBe(
      'http://localhost:5175/tab-manager/index.html',
    )
    image.src = `${chrome.runtime.getURL('_favicon/')}?pageUrl=${encodeURIComponent(pageUrl)}&size=48`
    onMutation()
    const githubFavicon = image.src
    image.src = `chrome-extension://preview/_favicon/?pageUrl=${encodeURIComponent('https://docs.google.com/document/project')}&size=48`
    onMutation()
    const docsFavicon = image.src

    expect(docsFavicon).not.toBe(githubFavicon)
    image.src = `chrome-extension://preview/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=48`
    onMutation()
    expect(image.src).toBe(githubFavicon)
  })

  it('keeps Search and Settings inactive in the preview', async () => {
    const pages = []
    const chrome = loadMock(mockSource, browser, {
      open: (path) => pages.push(path),
    })
    await chrome.action.openPopup()
    await chrome.runtime.openOptionsPage()
    expect(pages).toEqual([])
  })

  it('emits tab changes, restores discarded tabs on activation, and maintains window order', async () => {
    const chrome = loadMock()
    const changed = []
    const activated = []
    const removed = []
    chrome.tabs.onUpdated.addListener((id, changes) =>
      changed.push([id, changes]),
    )
    chrome.tabs.onActivated.addListener((info) => activated.push(info))
    chrome.tabs.onRemoved.addListener((id) => removed.push(id))
    expect(await chrome.tabs.discard(1)).toBeUndefined()
    expect((await chrome.tabs.discard(5)).discarded).toBe(true)
    await chrome.tabs.update(5, { active: true })
    expect((await chrome.tabs.get(5)).discarded).toBe(false)
    expect((await chrome.tabs.get(1)).active).toBe(false)
    expect(activated).toEqual([{ tabId: 5, windowId: 1 }])
    expect(changed).toContainEqual([5, { discarded: true, status: 'unloaded' }])
    const created = await chrome.tabs.create({
      windowId: 1,
      index: 1,
      active: false,
    })
    await chrome.tabs.remove([created.id, 5])
    expect(removed).toEqual([created.id, 5])
    expect(
      (await chrome.tabs.query({ windowId: 1 })).map((tab) => tab.index),
    ).toEqual([0, 1, 2, 3, 4])
    const copy = await chrome.tabs.duplicate(1)
    expect(copy.title).toBe('Project notes')
    expect(copy.id).not.toBe(1)
    expect(copy.id).not.toBe(created.id)
    await chrome.tabs.update(copy.id, { pinned: true, muted: true })
    expect(await chrome.tabs.get(copy.id)).toMatchObject({
      pinned: true,
      mutedInfo: { muted: true },
    })
  })

  it.each([
    { closing: 5, expected: 6 },
    { closing: 6, expected: 5 },
    { closing: 3, expected: 4 },
    { closing: 4, expected: 3 },
    { closing: 3, expected: 4, singleton: true },
  ])(
    'activates tab $expected after closing active tab $closing (singleton group: $singleton)',
    async ({ closing, expected, singleton }) => {
      const fixture = structuredClone(browser)
      if (singleton)
        fixture.tabs = fixture.tabs.map((tab) =>
          [2, 4].includes(tab.id) ? { ...tab, groupId: -1 } : tab,
        )
      const chrome = loadMock(mockSource, fixture)
      await chrome.tabs.update(closing, { active: true })
      const activated = []
      chrome.tabs.onActivated.addListener((info) => activated.push(info))
      await chrome.tabs.remove(closing)
      expect(
        (await chrome.tabs.query({ windowId: 1, active: true })).map(
          (tab) => tab.id,
        ),
      ).toEqual([expected])
      expect(activated).toEqual([{ tabId: expected, windowId: 1 }])
    },
  )

  it('ungroups pinned tabs and removes a group only when its last member leaves', async () => {
    const chrome = loadMock()
    const changes = []
    const removedGroups = []
    chrome.tabs.onUpdated.addListener((id, change) =>
      changes.push([id, change]),
    )
    chrome.tabGroups.onRemoved.addListener((group) =>
      removedGroups.push(group.id),
    )

    expect(await chrome.tabs.update(2, { pinned: true })).toMatchObject({
      pinned: true,
      groupId: -1,
    })
    expect(changes).toContainEqual([2, { pinned: true, groupId: -1 }])
    expect(
      (await chrome.tabs.query({ groupId: 10 })).map((tab) => tab.id),
    ).toEqual([3, 4])
    expect((await chrome.tabGroups.get(10)).id).toBe(10)
    expect(removedGroups).toEqual([])

    await chrome.tabs.update(3, { pinned: true })
    await chrome.tabs.update(4, { pinned: true })
    expect(await chrome.tabGroups.query()).toEqual([])
    expect(removedGroups).toEqual([10])
  })

  it('places pin and unpin transitions at the pinned boundary with contiguous indices', async () => {
    const chrome = loadMock()
    const moved = []
    const otherWindow = await chrome.tabs.query({ windowId: 2 })
    chrome.tabs.onMoved.addListener((id, info) => moved.push([id, info]))

    await chrome.tabs.update(5, { pinned: true })
    expect(
      (await chrome.tabs.query({ windowId: 1 })).map((tab) => tab.id),
    ).toEqual([1, 5, 2, 3, 4, 6])
    await chrome.tabs.update(3, { pinned: true })
    const reordered = await chrome.tabs.query({ windowId: 1 })
    expect(reordered.map((tab) => tab.id)).toEqual([1, 5, 3, 2, 4, 6])
    expect(reordered.map((tab) => tab.pinned)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
    ])
    expect(reordered.map((tab) => tab.index)).toEqual([0, 1, 2, 3, 4, 5])
    expect(
      (await chrome.tabs.query({ groupId: 10 })).map((tab) => tab.id),
    ).toEqual([2, 4])
    expect(moved).toEqual([
      [5, { windowId: 1, fromIndex: 4, toIndex: 1 }],
      [3, { windowId: 1, fromIndex: 3, toIndex: 2 }],
    ])
    await chrome.tabs.update(1, { pinned: true })
    expect(
      (await chrome.tabs.query({ windowId: 1 })).map((tab) => tab.id),
    ).toEqual(reordered.map((tab) => tab.id))
    expect(moved).toHaveLength(2)
    expect(await chrome.tabs.update(1, { pinned: false })).toMatchObject({
      pinned: false,
      index: 2,
    })
    expect(
      (await chrome.tabs.query({ windowId: 1 })).map((tab) => tab.id),
    ).toEqual([5, 3, 1, 2, 4, 6])
    expect(moved.at(-1)).toEqual([1, { windowId: 1, fromIndex: 0, toIndex: 2 }])
    await chrome.tabs.update(1, { pinned: false })
    expect(moved).toHaveLength(3)
    expect(await chrome.tabs.query({ windowId: 2 })).toEqual(otherWindow)
  })

  it('unpins tabs when adding them to new and existing groups', async () => {
    const chrome = loadMock()
    const changes = []
    chrome.tabs.onUpdated.addListener((id, change) =>
      changes.push([id, change]),
    )
    await chrome.tabs.update(5, { pinned: true })

    const groupId = await chrome.tabs.group({ tabIds: [1, 5] })
    expect(
      (await chrome.tabs.query({ groupId })).map((tab) => [tab.id, tab.pinned]),
    ).toEqual([
      [1, false],
      [5, false],
    ])
    expect(changes).toContainEqual([1, { groupId, pinned: false }])

    await chrome.tabs.update(5, { pinned: true })
    await chrome.tabs.group({ tabIds: [5], groupId: 10 })
    expect(await chrome.tabs.get(5)).toMatchObject({
      pinned: false,
      groupId: 10,
    })
    expect(changes).toContainEqual([5, { groupId: 10, pinned: false }])
    expect((await chrome.tabs.query({ groupId })).map((tab) => tab.id)).toEqual(
      [1],
    )
  })

  it('creates groups and windows and emits events when tabs move between them', async () => {
    const chrome = loadMock()
    const createdGroups = []
    const attached = []
    chrome.tabGroups.onCreated.addListener((group) => createdGroups.push(group))
    chrome.tabs.onAttached.addListener((id, info) => attached.push([id, info]))
    const groupId = await chrome.tabs.group({ tabIds: [5, 6] })
    expect(createdGroups).toHaveLength(1)
    await chrome.tabGroups.update(groupId, {
      title: 'Preview group',
      collapsed: true,
    })
    expect(await chrome.tabGroups.get(groupId)).toMatchObject({
      title: 'Preview group',
      collapsed: true,
    })
    expect((await chrome.tabs.query({ groupId })).map((tab) => tab.id)).toEqual(
      [5, 6],
    )
    await chrome.tabs.ungroup([5, 6])
    expect(await chrome.tabGroups.query()).toEqual(browser.groups)
    const window = await chrome.windows.create({ tabId: 6 })
    expect((await chrome.tabs.get(6)).windowId).toBe(window.id)
    expect(attached).toEqual([[6, { newWindowId: window.id, newPosition: 0 }]])
    expect((await chrome.windows.get(window.id)).focused).toBe(true)
    await chrome.windows.remove(window.id)
    expect(await chrome.windows.getAll()).toHaveLength(browser.windows.length)
    await expect(chrome.tabs.get(6)).rejects.toThrow('No sample browser item')
    const emptyWindow = await chrome.windows.create()
    await chrome.tabs.remove(emptyWindow.tabs[0].id)
    expect(await chrome.windows.getAll()).toHaveLength(browser.windows.length)
  })

  it('ungroups tabs moved across windows and removes groups after their last tab moves', async () => {
    const chrome = loadMock()
    const changes = []
    const removedGroups = []
    chrome.tabs.onUpdated.addListener((id, change) =>
      changes.push([id, change]),
    )
    chrome.tabGroups.onRemoved.addListener((group) =>
      removedGroups.push(group.id),
    )
    expect(await chrome.tabs.move(2, { windowId: 2, index: -1 })).toMatchObject(
      {
        windowId: 2,
        groupId: -1,
      },
    )
    expect(changes).toEqual([[2, { groupId: -1 }]])
    expect(await chrome.tabGroups.query()).toEqual(browser.groups)
    await chrome.tabs.move([3, 4], { windowId: 2, index: -1 })
    expect(changes).toEqual([
      [2, { groupId: -1 }],
      [3, { groupId: -1 }],
      [4, { groupId: -1 }],
    ])
    expect(
      (await chrome.tabs.query({ groupId: -1, windowId: 2 })).map(
        (tab) => tab.id,
      ),
    ).toEqual([9, 7, 8, 2, 3, 4])
    expect(await chrome.tabGroups.query()).toEqual([])
    expect(removedGroups).toEqual([10])
  })

  it('closes a source window when its last tabs move and leaves its destination intact', async () => {
    const chrome = loadMock()
    const removed = []
    chrome.windows.onRemoved.addListener((id) => removed.push(id))
    const ids = (await chrome.tabs.query({ windowId: 1 })).map((tab) => tab.id)
    await chrome.tabs.move(ids.slice(0, -1), { windowId: 2, index: -1 })
    expect(
      (await chrome.windows.getAll()).some((window) => window.id === 1),
    ).toBe(true)
    await chrome.tabs.move(ids.at(-1), { windowId: 2, index: -1 })
    expect(removed).toEqual([1])
    expect(
      (await chrome.windows.getAll()).some((window) => window.id === 2),
    ).toBe(true)
    expect(
      (await chrome.tabs.query({ windowId: 2 })).map((tab) => tab.id),
    ).toEqual(expect.arrayContaining(ids))
  })

  it('moves an entire group between windows with its identity and order intact', async () => {
    const chrome = loadMock()
    const group = await chrome.tabGroups.get(10)
    expect(await chrome.tabGroups.move(10, { windowId: 2, index: -1 })).toEqual(
      { ...group, windowId: 2 },
    )
    expect(
      (await chrome.tabs.query({ groupId: 10 })).map((tab) => ({
        id: tab.id,
        windowId: tab.windowId,
      })),
    ).toEqual([
      { id: 2, windowId: 2 },
      { id: 3, windowId: 2 },
      { id: 4, windowId: 2 },
    ])
    expect(
      (await chrome.tabs.query({ windowId: 2 })).map((tab) => tab.id),
    ).toEqual([9, 7, 8, 2, 3, 4])
    expect((await chrome.windows.getLastFocused()).id).toBe(1)
  })

  it('isolates preferences from the fixture and emits storage changes', async () => {
    const chrome = loadMock()
    const changes = []
    chrome.storage.local.onChanged.addListener((change, area) =>
      changes.push([change, area]),
    )
    const stored = await chrome.storage.local.get('preference-storage-key')
    stored['preference-storage-key'].theme = 'light'
    expect(
      (await chrome.storage.local.get('preference-storage-key'))[
        'preference-storage-key'
      ].theme,
    ).toBe('dark')
    await chrome.storage.local.set(stored)
    expect(changes[0][1]).toBe('local')
    expect(
      (await chrome.storage.local.get('preference-storage-key'))[
        'preference-storage-key'
      ].theme,
    ).toBe('light')
    expect(browser.preferences.theme).toBe('dark')
    await chrome.storage.local.remove('preference-storage-key')
    expect(
      (await chrome.storage.local.get('preference-storage-key'))[
        'preference-storage-key'
      ],
    ).toBeUndefined()
  })
})

describe('native split view preview boundary', () => {
  it('creates and separates pairs, emits membership changes, and clears a pair when one tab closes', async () => {
    const chrome = loadMock(mockSource, structuredClone(browser))
    const changes = []
    chrome.tabs.onUpdated.addListener((id, change) => {
      if (change.splitViewId !== undefined)
        changes.push([id, change.splitViewId])
    })
    const id = await chrome.tabs.createSplit([2, 3])
    expect(
      (await chrome.tabs.query({ splitViewId: id })).map((tab) => tab.id),
    ).toEqual([2, 3])
    expect(changes).toEqual([
      [2, id],
      [3, id],
    ])
    await chrome.tabs.unsplit(id)
    expect(await chrome.tabs.query({ splitViewId: id })).toEqual([])
    await expect(chrome.tabs.createSplit([1, 2])).rejects.toThrow('matching')
    await expect(chrome.tabs.createSplit([2, 4])).rejects.toThrow('adjacent')
    const tab = await chrome.tabs.create({
      windowId: 1,
      splitWithTabId: 2,
      index: 2,
      active: true,
    })
    expect(tab.groupId).toBe(10)
    expect((await chrome.tabs.get(2)).splitViewId).toBe(tab.splitViewId)
    await chrome.tabs.remove(tab.id)
    expect((await chrome.tabs.get(2)).splitViewId).toBe(-1)
  })
})
