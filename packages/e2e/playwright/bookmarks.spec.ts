import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('browses, filters, edits, moves, and deletes native bookmark folders in the narrow sidebar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/tab-manager/index.html')
  const switchBefore = await page
    .getByRole('group', { name: 'Tab manager views' })
    .boundingBox()
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Bookmarks', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(
    (await page
      .getByRole('group', { name: 'Tab manager views' })
      .boundingBox())!.y,
  ).toBe(switchBefore!.y)
  await page
    .getByRole('option', { name: 'Folder: Bookmarks bar', exact: true })
    .click()
  const entries = page.getByRole('listbox', { name: 'Bookmark entries' })
  await entries
    .getByRole('option', { name: 'Folder: Tabby project', exact: true })
    .focus()
  await page.keyboard.press('ArrowDown')
  await expect(
    entries
      .getByRole('option', { name: 'Folder: Reading list', exact: true })
      .first(),
  ).toBeFocused()
  await page
    .getByRole('searchbox', { name: 'Filter bookmarks' })
    .fill('Bookmarks API')
  await expect(entries.getByRole('option')).toHaveCount(1)
  await expect(entries).toContainText('Research')
  await page.getByRole('searchbox', { name: 'Filter bookmarks' }).fill('')
  await page.getByRole('button', { name: 'New folder', exact: true }).click()
  const editor = page.getByRole('form', { name: 'Bookmark editor' })
  await editor.getByRole('textbox', { name: 'Name', exact: true }).fill('Trip')
  await editor.getByRole('button', { name: 'Save', exact: true }).click()
  await entries
    .getByRole('option', { name: 'Folder: Trip', exact: true })
    .click()
  await page.getByRole('button', { name: 'New bookmark', exact: true }).click()
  await editor.getByRole('textbox', { name: 'Name', exact: true }).fill('Guide')
  await editor
    .getByRole('textbox', { name: 'URL', exact: true })
    .fill('https://example.com/guide')
  await editor.getByRole('button', { name: 'Save', exact: true }).click()
  await page
    .getByRole('option', { name: 'Bookmark: Guide', exact: true })
    .click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Edit bookmark', exact: true })
    .click()
  await editor.getByRole('textbox', { name: 'Name', exact: true }).fill('Map')
  await editor
    .getByRole('textbox', { name: 'URL', exact: true })
    .fill('https://example.com/map')
  await editor.getByRole('button', { name: 'Save', exact: true }).click()
  await page
    .getByRole('option', { name: 'Bookmark: Map', exact: true })
    .click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Move or reorder', exact: true })
    .click()
  await editor
    .getByRole('combobox', { name: 'Parent folder' })
    .selectOption({ label: 'Other bookmarks' })
  await editor.getByRole('button', { name: 'Move', exact: true }).click()
  await expect(entries.getByRole('option')).toHaveCount(0)
  await page.evaluate(() =>
    chrome.bookmarks.create({ parentId: '1', title: 'External folder' }),
  )
  await page.getByRole('button', { name: 'Parent folder' }).click()
  await expect(
    entries.getByRole('option', {
      name: 'Folder: External folder',
      exact: true,
    }),
  ).toBeVisible()
  await page
    .getByRole('option', { name: 'Folder: Tabby project', exact: true })
    .click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Delete folder and contents' })
    .click()
  await expect(editor).toContainText('all 4 bookmarks and 2 folders')
  await editor.getByRole('button', { name: 'Delete permanently' }).click()
  await expect(
    entries.getByRole('option', { name: 'Folder: Tabby project', exact: true }),
  ).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false)
  await page.getByRole('button', { name: 'Tabs', exact: true }).click()
  await expect(page.locator('[data-tab-id="1"]')).toBeVisible()
})

test('bookmarks a window and restores its tab order, group boundaries, and colors', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const before = await page.evaluate(async () => {
    const groupId = await chrome.tabs.group({
      tabIds: [1, 2],
      createProperties: { windowId: 1 },
    })
    await chrome.tabGroups.update(groupId, {
      title: 'Reading',
      color: 'purple',
    })
    const tabs = await chrome.tabs.query({ windowId: 1 })
    const groups = await chrome.tabGroups.query({ windowId: 1 })
    return tabs.map((tab) => ({
      url: tab.url,
      group: groups.find((group) => group.id === tab.groupId)?.color,
    }))
  })
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click()
  await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await page.getByRole('menuitem', { name: 'New', exact: true }).click()
  await page
    .getByRole('menuitem', { name: 'Bookmark a window', exact: true })
    .click()
  const editor = page.getByRole('form', { name: 'Bookmark editor' })
  await editor
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Saved project')
  await editor
    .getByRole('combobox', { name: 'Parent folder' })
    .selectOption({ label: 'Other bookmarks' })
  await editor
    .getByRole('button', { name: 'Bookmark window', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Bookmarked 6 tabs')
  await page
    .getByRole('button', { name: 'Folder actions', exact: true })
    .click()
  await page
    .getByRole('menuitem', { name: 'Restore as one window', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText(
    'Opened 6 tabs in 1 new window',
  )
  const restored = await page.evaluate(async () => {
    const windows = await chrome.windows.getAll()
    const windowId = Math.max(...windows.map((window) => window.id!))
    const tabs = await chrome.tabs.query({ windowId })
    const groups = await chrome.tabGroups.query({ windowId })
    return tabs.map((tab) => ({
      url: tab.url,
      group: groups.find((group) => group.id === tab.groupId)?.color,
    }))
  })
  expect(restored).toEqual(before)
  await page.screenshot({ path: testInfo.outputPath('bookmarks.png') })
})

test('navigates past unsupported bookmarks and edits folders in a large collection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  await page.evaluate(async () => {
    const folder = await chrome.bookmarks.create({
      parentId: '2',
      title: 'Keyboard collection',
    })
    await chrome.bookmarks.create({
      parentId: folder.id,
      title: 'First',
      url: 'https://example.com/first',
    })
    await chrome.bookmarks.create({
      parentId: folder.id,
      title: 'Bookmarklet',
      url: 'javascript:alert(1)',
    })
    await chrome.bookmarks.create({
      parentId: folder.id,
      title: 'Last',
      url: 'https://example.com/last',
    })
  })
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click()
  await page
    .getByRole('searchbox', { name: 'Filter bookmarks' })
    .fill('Keyboard collection')
  await page
    .getByRole('listbox', { name: 'Bookmark entries' })
    .getByRole('option', { name: 'Folder: Keyboard collection', exact: true })
    .click()
  const first = page.getByRole('option', {
    name: 'Bookmark: First',
    exact: true,
  })
  const last = page.getByRole('option', { name: 'Bookmark: Last', exact: true })
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('option', { name: 'Bookmark: Bookmarklet', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(last).toBeFocused()
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
  await page.getByRole('button', { name: 'Tabs', exact: true }).click()
  await page.route('**/__preview/mock-chrome.js', async (route) => {
    const response = await route.fetch()
    const source = await response.text()
    const tree = [
      {
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            parentId: '0',
            title: 'Bookmarks bar',
            children: Array.from({ length: 10000 }, (_, index) => ({
              id: String(index + 10),
              parentId: '1',
              title: 'Project',
              children: [],
            })),
          },
        ],
      },
    ]
    await route.fulfill({
      contentType: 'text/javascript',
      body: source.replace(
        ';(() => {',
        `;globalThis.__TABBY_PREVIEW__.browser.bookmarks = ${JSON.stringify(tree)};\n;(() => {`,
      ),
    })
  })
  await page.reload()
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click()
  await page.getByRole('button', { name: 'New folder', exact: true }).click()
  const editor = page.getByRole('form', { name: 'Bookmark editor' })
  await editor
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('New project')
  await expect(
    editor.getByRole('textbox', { name: 'Name', exact: true }),
  ).toHaveValue('New project')
  await expect(
    editor.getByRole('option', {
      name: 'Bookmarks bar / Project (10000)',
      exact: true,
    }),
  ).toHaveCount(1)
})

test('uses tab-style selection and context menus for opening, moving, and deleting bookmarks together', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const parentId = await page.evaluate(async () => {
    const folder = await chrome.bookmarks.create({
      parentId: '2',
      title: 'Batch examples',
    })
    for (const title of ['A', 'B', 'C', 'D'])
      await chrome.bookmarks.create({
        parentId: folder.id,
        title,
        url: `https://example.com/${title}`,
      })
    return folder.id
  })
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click()
  const filter = page.getByRole('searchbox', { name: 'Filter bookmarks' })
  await filter.fill('Batch examples')
  await page
    .getByRole('option', { name: 'Folder: Batch examples', exact: true })
    .click()
  const entry = (title: string) =>
    page.getByRole('option', { name: `Bookmark: ${title}`, exact: true })
  const selected = page
    .getByRole('listbox', { name: 'Bookmark entries' })
    .getByRole('option', { selected: true })
  await entry('A').click({ modifiers: ['ControlOrMeta'] })
  await entry('C').click({ modifiers: ['ControlOrMeta'] })
  await expect(selected).toHaveCount(2)
  await entry('A').click({ button: 'right' })
  await expect(
    page.getByRole('menuitem', { name: 'Delete 2 items', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(entry('A')).toBeFocused()
  await entry('D').click({ modifiers: ['Shift'] })
  await expect(selected).toHaveCount(3)
  await page.keyboard.press('ControlOrMeta+a')
  await expect(selected).toHaveCount(4)
  await page.keyboard.press('Escape')
  await expect(selected).toHaveCount(0)
  await entry('B').focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('ArrowDown')
  await expect(entry('C')).toBeFocused()
  await expect(selected).toHaveCount(1)
  await page.keyboard.press('Space')
  await expect(selected).toHaveCount(2)
  await page.keyboard.press('ArrowDown')
  await expect(entry('D')).toBeFocused()
  await expect(selected).toHaveCount(2)
  await entry('B').click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Open 2 bookmarks in', exact: true })
    .click()
  await page
    .getByRole('menuitem', { name: 'A new group in this window', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Opened 2 tabs')
  const opened = await page.evaluate(async () =>
    (await chrome.tabs.query({ windowId: 1 }))
      .filter((tab) => /example.com\/[BC]$/.test(tab.url ?? ''))
      .map((tab) => ({ url: tab.url, groupId: tab.groupId })),
  )
  expect(opened.map((tab) => tab.url)).toEqual([
    'https://example.com/B',
    'https://example.com/C',
  ])
  expect(opened[0]?.groupId).toBe(opened[1]?.groupId)
  expect(opened[0]?.groupId).not.toBe(-1)
  await entry('B').click({ button: 'right' })
  await page.screenshot({ path: testInfo.outputPath('bookmark-selection.png') })
  await page
    .getByRole('menuitem', { name: 'Move 2 items', exact: true })
    .click()
  const editor = page.getByRole('form', { name: 'Bookmark editor' })
  await editor
    .getByRole('spinbutton', {
      name: 'Position (leave blank for end)',
      exact: true,
    })
    .fill('1')
  await editor.getByRole('button', { name: 'Move', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Moved 2 items')
  expect(
    await page.evaluate(
      async (id) =>
        (await chrome.bookmarks.getSubTree(id))[0]!.children!.map(
          (node) => node.title,
        ),
      parentId,
    ),
  ).toEqual(['B', 'C', 'A', 'D'])
  await entry('B').click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Delete 2 items', exact: true })
    .click()
  await expect(editor).toContainText('2 items: “B”, “C”')
  await editor
    .getByRole('button', { name: 'Delete permanently', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Deleted 2 items')
  await expect(selected).toHaveCount(0)
  await expect(entry('B')).toHaveCount(0)
  await expect(entry('C')).toHaveCount(0)
  await expect(entry('A')).toBeFocused()
  await page.evaluate(async (id) => {
    const [folder] = await chrome.bookmarks.getSubTree(id)
    const node = folder!.children!.find((node) => node.title === 'A')!
    await chrome.bookmarks.remove(node.id)
  }, parentId)
  await expect(entry('D')).toBeFocused()
  await filter.fill('https')
  await page
    .getByRole('option', { name: 'Bookmark: Tabby on GitHub', exact: true })
    .click({ modifiers: ['ControlOrMeta'] })
  await page
    .getByRole('option', { name: 'Bookmark: Company handbook', exact: true })
    .click({ modifiers: ['ControlOrMeta'] })
  await page
    .getByRole('option', { name: 'Bookmark: Company handbook', exact: true })
    .click({ button: 'right' })
  await expect(
    page.getByRole('menuitem', { name: 'Delete 2 items', exact: true }),
  ).toBeDisabled()
  await expect(
    page.getByRole('menuitem', { name: 'Move 2 items', exact: true }),
  ).toBeDisabled()
})
