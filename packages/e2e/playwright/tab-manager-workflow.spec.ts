import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('keeps focus beside closed inactive tabs and follows newly active tabs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  await row(1).click()
  await row(2).focus()
  await expect(row(2)).toBeFocused()
  await page
    .locator('[data-tab-id="3"]')
    .getByRole('button', { name: 'Close tab' })
    .click()
  await expect(row(3)).toHaveCount(0)
  await expect(row(4)).toBeFocused()
  await expect(row(1)).toHaveAttribute('aria-current', 'page')
  await expect(row(1)).toHaveAttribute('aria-selected', 'true')

  await page.evaluate(() => chrome.tabs.remove(4))
  await expect(row(4)).toHaveCount(0)
  await expect(row(2)).toBeFocused()
  await expect(row(1)).toHaveAttribute('aria-current', 'page')
  await expect(row(1)).toHaveAttribute('aria-selected', 'true')

  await row(5).click()
  await page.evaluate(() => chrome.tabs.remove(5))
  await expect(row(5)).toHaveCount(0)
  await expect(row(6)).toBeFocused()
  await expect(row(6)).toHaveAttribute('aria-current', 'page')

  await page.evaluate(() => chrome.tabs.remove(6))
  await expect(row(6)).toHaveCount(0)
  await expect(row(2)).toBeFocused()
  await expect(row(2)).toHaveAttribute('aria-current', 'page')
})

test('places pin and unpin transitions at the pinned boundary, including tabs taken out of groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const pin = async (id: number) => {
    await page
      .locator(`[data-tab-id="${id}"] [data-tab-option]`)
      .click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Pin 1 tab', exact: true }).click()
  }
  const displayedOrder = () =>
    page
      .locator('[data-tab-id]')
      .evaluateAll((rows) =>
        rows.map((row) => Number(row.getAttribute('data-tab-id'))),
      )
  await pin(5)
  await expect.poll(displayedOrder).toEqual([1, 5, 2, 3, 4, 6])
  await pin(3)
  await expect.poll(displayedOrder).toEqual([1, 5, 3, 2, 4, 6])
  await expect(page.locator('[data-tab-id="3"]')).toHaveAttribute(
    'data-pinned',
    'true',
  )
  await expect(
    page.locator('[data-group-id="10"] [data-tab-id="3"]'),
  ).toHaveCount(0)
  await expect(page.locator('[data-group-id="10"] [data-tab-id]')).toHaveCount(
    2,
  )
  await page
    .locator('[data-tab-id="1"] [data-tab-option]')
    .click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Unpin 1 tab', exact: true }).click()
  await expect.poll(displayedOrder).toEqual([5, 3, 1, 2, 4, 6])
  await expect(page.locator('[data-tab-id="1"]')).not.toHaveAttribute(
    'data-pinned',
  )
})

test('browses windows, keeps selection local, and transitions right-click actions beside the cursor and toggles the menu button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const selected = page.locator('[data-tab-option][aria-selected="true"]')
  const switcher = page.locator('[data-window-picker-trigger]')
  const choose = async (id: number) => {
    await switcher.click()
    await page.locator(`[data-window-choice="${id}"]`).click()
  }
  await choose(2)
  await expect(switcher).toContainText('Reading room')
  await expect(
    page.getByText('Focused in Chrome', { exact: false }),
  ).toHaveCount(0)
  await choose(1)
  await page.getByRole('button', { name: 'Tabby', exact: true }).click()
  await page.keyboard.press('ControlOrMeta+a')
  await expect(selected).toHaveCount(6)
  await page.keyboard.press('Escape')
  await row(2).click()
  await row(4).click({ modifiers: ['ControlOrMeta'] })
  await row(2).focus()
  await row(2).click({ button: 'right', position: { x: 8, y: 4 } })
  await expect(selected).toHaveCount(2)
  const root = page.getByRole('menu', { name: 'Selection actions' })
  const more = page.getByRole('button', { name: 'More actions' })
  const menuBounds = await root.boundingBox()
  const rowBounds = await row(2).boundingBox()
  expect(Math.abs(menuBounds!.x - (rowBounds!.x + 28))).toBeLessThan(2)
  const [minimumOpacity] = await Promise.all([
    root.evaluate(async (menu) => {
      let minimum = 1
      for (let frame = 0; frame < 20; frame++) {
        await new Promise(requestAnimationFrame)
        minimum = Math.min(minimum, Number(getComputedStyle(menu).opacity))
      }
      return minimum
    }),
    row(5).click({ button: 'right', position: { x: 4, y: 4 } }),
  ])
  expect(minimumOpacity).toBeLessThan(0.5)
  await expect(root).toBeVisible()
  await expect(root).toHaveCSS('opacity', '1')
  await expect(
    page.getByRole('menuitem', { name: 'Close 1 tab', exact: true }),
  ).toBeVisible()
  await expect(row(5)).toHaveAttribute('aria-selected', 'true')
  await expect(selected).toHaveCount(1)
  expect(
    await page.evaluate(async () => (await chrome.tabs.get(2)).active),
  ).toBe(true)
  await row(5).click({
    button: 'right',
    position: { x: (await row(5).boundingBox())!.width - 4, y: 4 },
  })
  await expect(root).toHaveCSS('opacity', '1')
  const edgeBounds = await root.boundingBox()
  expect(edgeBounds!.x).toBeGreaterThanOrEqual(8)
  expect(edgeBounds!.x + edgeBounds!.width).toBeLessThan(473)
  await more.click()
  await expect(root).toHaveCount(0)
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await more.click()
  await expect(root).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(more).toBeFocused()
  await row(2).click()
  await row(4).click({ modifiers: ['ControlOrMeta'] })
  await row(2).click({ button: 'right', position: { x: 8, y: 4 } })
  const move = page.getByRole('menuitem', {
    name: 'Move 2 tabs to window',
    exact: true,
  })
  await move.hover()
  await page.waitForTimeout(200)
  const destinations = page.getByRole('menu', { name: 'Move 2 tabs to window' })
  await expect(destinations).toHaveCount(0)
  await move.click()
  await expect(destinations).toBeVisible()
  const newWindow = destinations.getByRole('menuitem').last()
  await expect(newWindow).toHaveText('New window')
  await expect(newWindow.locator('svg.lucide-plus')).toBeVisible()
  await expect(
    page.getByRole('menu', { name: 'Selection actions' }),
  ).toHaveCount(0)
  await page.keyboard.press('ArrowLeft')
  await expect(move).toBeFocused()
  const group = page.getByRole('menuitem', {
    name: 'Group 2 tabs',
    exact: true,
  })
  await group.click()
  const groups = page.getByRole('menu', { name: 'Group 2 tabs' })
  await expect(groups.getByRole('menuitem').last()).toHaveText('New Group · 2')
  await expect(
    groups.getByRole('menuitem').last().locator('svg.lucide-plus'),
  ).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(group).toBeFocused()
  await move.click()
  await destinations
    .getByRole('menuitem', { name: /Reading room/ })
    .click({ modifiers: ['Shift'] })
  await expect(switcher).toContainText('Reading room')
  await expect(row(2)).toHaveAttribute('aria-selected', 'true')
  await expect(row(4)).toHaveAttribute('aria-selected', 'true')
  expect(
    await page.evaluate(async () =>
      (await chrome.tabs.query({ windowId: 2 })).map((tab) => tab.id),
    ),
  ).toEqual([9, 7, 8, 2, 4])
  await choose(2)
  await switcher.click()
  await page
    .getByRole('button', { name: 'Close window: Reading room', exact: true })
    .click()
  await expect(switcher).toContainText('Tabby')
})

test('moves between windows in the background and follows Shift-click or Shift+Enter', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const focusedWindow = () =>
    page.evaluate(async () => (await chrome.windows.getLastFocused()).id)
  const moveMenu = async (
    source: ReturnType<typeof row>,
    label: string,
    destination = /^New window/,
  ) => {
    await source.click({ button: 'right' })
    await page.getByRole('menuitem', { name: label, exact: true }).click()
    return page.getByRole('menuitem', { name: destination })
  }
  await (
    await moveMenu(row(5), 'Move 1 tab to window', /^Reading room/)
  ).click()
  await expect(row(5)).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'Reading room',
  )
  expect(await focusedWindow()).toBe(1)
  await page.locator('[data-window-picker-trigger]').click()
  await page.locator('[data-window-choice="1"]').click()
  await expect(row(6)).toBeVisible()

  await (
    await moveMenu(row(6), 'Move 1 tab to window', /^Reading room/)
  ).click({ modifiers: ['Shift'] })
  await expect(row(6)).toHaveAttribute('aria-selected', 'true')
  const tabWindow = await page.evaluate(
    async () => (await chrome.tabs.get(6)).windowId,
  )
  expect(tabWindow).not.toBe(1)
  expect(await focusedWindow()).toBe(tabWindow)

  await page.locator('[data-window-picker-trigger]').click()
  await page.locator('[data-window-choice="1"]').click()
  const group = page.locator('[data-group-id="10"] [data-group-option]')
  const destination = await moveMenu(group, 'Move tab group to window')
  await destination.focus()
  await page.keyboard.press('Shift+Enter')
  await expect(row(2)).toHaveAttribute('aria-selected', 'true')
  const groupWindow = () =>
    page.evaluate(async () => (await chrome.tabGroups.get(10)).windowId)
  await expect.poll(groupWindow).not.toBe(1)
  await expect.poll(focusedWindow).toBe(await groupWindow())
  expect(
    await page.evaluate(async () =>
      (await chrome.tabs.query({ groupId: 10 })).map((tab) => tab.id),
    ),
  ).toEqual([2, 3, 4])
})

test('moves a whole group through a submenu and closes duplicates in other windows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const group = page.locator('[data-group-id="10"] [data-group-option]')
  await group.focus()
  await page.keyboard.press('ArrowDown')
  const tabRing = await page
    .locator('[data-tab-id="2"]')
    .evaluate((node) => getComputedStyle(node, '::after').boxShadow)
  await page.keyboard.press('ArrowUp')
  await expect(group).toBeFocused()
  expect(
    await page
      .locator('[data-group-id="10"]')
      .evaluate((node) => getComputedStyle(node, '::after').boxShadow),
  ).toBe(tabRing)
  await page.keyboard.press('ArrowLeft')
  await expect(group).toHaveAttribute('aria-expanded', 'false')
  await expect(row(2)).not.toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(group).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('ArrowRight')
  await expect(group).toHaveAttribute('aria-expanded', 'true')
  await expect(row(2)).toBeVisible()
  await expect
    .poll(async () =>
      Math.abs(
        (await page
          .getByRole('button', { name: 'New tab in Tabby', exact: true })
          .boundingBox())!.height -
          (await page.locator('[data-tab-id="2"]').boundingBox())!.height,
      ),
    )
    .toBeLessThan(0.25)
  await expect(group).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await expect(row(5)).toBeFocused()
  await group.focus()
  await page.keyboard.press('Enter')
  await expect(row(2)).toBeVisible()
  await row(2).click({ button: 'right' })
  const remove = page.getByRole('menuitem', {
    name: 'Remove 2 duplicates',
    exact: true,
  })
  await expect(remove).toBeVisible()
  await remove.click()
  await expect(row(2)).toBeVisible()
  expect(
    await page.evaluate(async () =>
      (await chrome.tabs.query({ windowId: 2 })).map((tab) => tab.id),
    ),
  ).toEqual([8])
  await page
    .getByRole('button', { name: 'Tabby', exact: true })
    .click({ button: 'right' })
  await expect(
    page.getByRole('menuitem', { name: 'Group 3 tabs', exact: true }),
  ).toHaveCount(0)
  const move = page.getByRole('menuitem', {
    name: 'Move tab group to window',
    exact: true,
  })
  await move.focus()
  await page.keyboard.press('ArrowRight')
  const destinations = page.getByRole('menu', {
    name: 'Move tab group to window',
  })
  await expect(destinations).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(move).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(destinations).toBeVisible()
  await destinations.getByRole('menuitem', { name: /New window/i }).click()
  await expect(row(2)).toHaveAttribute('aria-selected', 'true')
  const moved = await page.evaluate(async () => ({
    group: await chrome.tabGroups.get(10),
    tabs: (await chrome.tabs.query({ groupId: 10 })).map((tab) => tab.id),
    focused: (await chrome.windows.getLastFocused()).id,
  }))
  expect(moved).toMatchObject({
    group: { title: 'Tabby', color: 'blue', windowId: 13 },
    tabs: [2, 3, 4],
    focused: 1,
  })
  await page.locator('[data-window-picker-trigger]').click()
  await page.locator('[data-window-choice="13"]').click()
  await page
    .getByRole('button', { name: 'Tabby', exact: true })
    .click({ button: 'right' })
  await expect(
    page.getByRole('menuitem', { name: 'Pin 3 tabs', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('menuitem', { name: 'Group 3 tabs', exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole('menuitem', { name: 'Move tab group to window', exact: true })
    .click()
  await expect(page.getByRole('menuitem', { name: /^New window/ })).toHaveCount(
    0,
  )
})

test('organizes a tab with local action keys and keeps native focus through pinning', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/tab-manager/index.html')
  const row = () => page.locator('[data-tab-id="5"] [data-tab-option]')
  await row().focus()
  await row().press('p')
  await expect(page.locator('[data-tab-id="5"]')).toHaveAttribute(
    'data-pinned',
    'true',
  )
  await expect(row()).toBeFocused()
  await row().press('p')
  await expect(page.locator('[data-tab-id="5"]')).not.toHaveAttribute(
    'data-pinned',
  )
  await expect(row()).toBeFocused()
  await row().press('g')
  await expect(page.getByRole('menuitem').first()).toBeFocused()
  const chooser = page.getByRole('menu')
  await expect
    .poll(async () => {
      const item = (await row().boundingBox())!
      const menu = (await chooser.boundingBox())!
      return Math.abs(menu.x - item.x)
    })
    .toBeLessThan(20)
  await expect
    .poll(async () => {
      const item = (await row().boundingBox())!
      const menu = (await chooser.boundingBox())!
      return Math.max(
        0,
        menu.y - item.y - item.height,
        item.y - menu.y - menu.height,
      )
    })
    .toBeLessThan(16)
  await page.keyboard.press('Escape')
  await expect(row()).toBeFocused()
  await row().press('g')
  const newGroup = page.getByRole('menuitem', { name: /New group/i })
  await newGroup.focus()
  await newGroup.press('Enter')
  await expect(row()).toHaveCount(1)
  await expect(page.locator('[data-group-id] [data-tab-id="5"]')).toHaveCount(1)
  await expect(row()).toBeFocused()
  await row().press('u')
  await expect(page.locator('[data-group-id] [data-tab-id="5"]')).toHaveCount(0)
  await expect(row()).toHaveCount(1)
  await row().press('d')
  await expect(page.locator('[data-tab-id]')).toHaveCount(7)
  await row().click({ button: 'right' })
  for (const [name, key] of [
    ['Pin 1 tab', 'P'],
    ['Reload 1 tab', 'R'],
    ['Duplicate 1 tab', 'D'],
    ['Group 1 tab', 'G'],
    ['Move 1 tab to window', 'W'],
    ['Copy 1 title or URL', 'C'],
    ['New tab below', 'N'],
  ]) {
    await expect(
      page.getByRole('menuitem', { name, exact: true }).locator('kbd'),
    ).toHaveText(key)
  }
  const close = page.getByRole('menuitem', { name: 'Close 1 tab', exact: true })
  await expect(close).toHaveAttribute('aria-keyshortcuts', 'Delete Backspace')
  await expect(close.locator('kbd svg')).toHaveCount(1)
  await expect(close.locator('kbd')).toHaveText('')
  const positions = await page
    .locator('[role="menuitem"] kbd')
    .evaluateAll((keys) => keys.map((key) => key.getBoundingClientRect().right))
  expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1)
  await page.setViewportSize({ width: 320, height: 640 })
  await expect
    .poll(async () => {
      const bounds = (await page.getByRole('menu').boundingBox())!
      return bounds.x >= 0 && bounds.x + bounds.width <= 320
    })
    .toBe(true)
  await page.keyboard.press('p')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page.locator('[data-tab-id="5"]')).toHaveAttribute(
    'data-pinned',
    'true',
  )
  await expect(row()).toBeFocused()
  await row().click({ button: 'right' })
  await page.keyboard.press('p')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page.locator('[data-tab-id="5"]')).not.toHaveAttribute(
    'data-pinned',
  )
  await row().click({ button: 'right' })
  await page.keyboard.press('g')
  await expect(page.getByRole('menu', { name: 'Group 1 tab' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(row()).toBeFocused()
  await page.mouse.move(0, 0)
  for (const [key, name] of [
    ['w', /Move/],
    ['c', /Copy/],
  ] as const) {
    await row().click({ button: 'right' })
    await page.keyboard.press(key)
    await expect(page.getByRole('menu', { name })).toBeVisible()
    await expect(page.getByRole('menuitem').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(row()).toBeFocused()
  }
  await row().press('z')
  await expect(row()).toHaveAttribute('aria-label', /unloaded/)
  await row().press('n')
  await expect(page.locator('[data-tab-id]')).toHaveCount(8)
  await row().click({ button: 'right' })
  await page.keyboard.press('Backspace')
  await expect(page.locator('[data-tab-id="5"]')).toHaveCount(0)
  await expect(page.locator('[data-tab-id]')).toHaveCount(7)
  await expect(page.getByRole('menu')).toHaveCount(0)
})

test('restores focus in the replacement window when a window closes with its actions menu open', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const original = page.locator('[data-tab-id="1"] [data-tab-option]')
  await original.focus()
  await original.press('ContextMenu')
  await expect(page.getByRole('menu')).toBeVisible()
  await page.evaluate(() => chrome.windows.remove(1))
  await expect(original).toHaveCount(0)
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(
    page.locator('[data-tab-id="7"] [data-tab-option]'),
  ).toBeFocused()
})

test('restores the neighboring tab after closing from its context menu', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  await row(3).focus()
  await row(3).press('ContextMenu')
  await page.keyboard.press('Backspace')
  await expect(row(3)).toHaveCount(0)
  await expect(row(4)).toBeFocused()
})

test.describe('pin indicators', () => {
  test.use({
    browserData: {
      ...browser,
      groups: [],
      tabs: browser.tabs
        .filter((tab) => tab.windowId === 1)
        .map((tab) => ({
          ...tab,
          groupId: -1,
          pinned: tab.id === 1 || tab.id === 2,
          url: tab.id === 3 ? browser.tabs[0].url : tab.url,
        })),
    },
  })

  test('unpins by pointer and keyboard without activating or selecting another tab', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 640 })
    await page.goto('/tab-manager/index.html')
    const tab = (id: number) => page.locator(`[data-tab-id="${id}"]`)
    await tab(1).locator('[data-tab-option]').click()
    const duplicate = tab(1).locator('[data-tab-duplicate]')
    await expect(duplicate).toHaveText('Duplicate')
    await expect(duplicate).toHaveCSS('cursor', 'default')
    await expect(duplicate).not.toHaveAttribute('role', 'button')
    await duplicate.hover()
    await page.waitForTimeout(200)
    await expect(duplicate).not.toHaveAttribute('title')
    await expect(page.getByRole('tooltip')).toHaveCount(0)
    const inactivePin = tab(2).getByRole('button', {
      name: 'Unpin tab',
      exact: true,
    })
    await inactivePin.hover()
    await expect(page.getByRole('tooltip')).toHaveText('Unpin', {
      timeout: 750,
    })
    await expect(inactivePin.locator('.lucide-pin-off')).toBeVisible()
    await expect(inactivePin.locator('.lucide-pin')).toBeHidden()
    await expect(inactivePin).not.toHaveAttribute('title')
    await inactivePin.press('Escape')
    await expect(page.getByRole('tooltip')).toHaveCount(0)
    await inactivePin.click()
    await expect(tab(2)).not.toHaveAttribute('data-pinned', 'true')
    await expect(tab(1)).toHaveAttribute('data-pinned', 'true')
    await expect(tab(1)).toHaveAttribute('data-active', 'true')
    await expect(tab(1)).toHaveAttribute('data-selected', 'true')
    await expect(tab(2)).toHaveAttribute('data-selected', 'false')
    const pin = tab(1).getByRole('button', { name: 'Unpin tab', exact: true })
    const option = tab(1).locator('[data-tab-option]')
    await option.click()
    await option.press('Tab')
    await expect(pin).toBeFocused()
    await pin.press('Shift+Tab')
    await expect(option).toBeFocused()
    await option.press('Tab')
    await pin.press('Enter')
    await expect(tab(1)).not.toHaveAttribute('data-pinned', 'true')
    await expect(tab(1)).toHaveAttribute('data-active', 'true')
    const close = tab(2).getByRole('button', { name: 'Close tab', exact: true })
    await close.hover()
    await expect(page.getByRole('tooltip')).toHaveText('Close', {
      timeout: 750,
    })
    await expect(close).not.toHaveAttribute('title')
    await close.click()
    await expect(tab(2)).toHaveCount(0)
    await expect(page.getByRole('tooltip')).toHaveCount(0)
    await expect(tab(1)).toHaveAttribute('data-active', 'true')
  })
})

test.describe('context menu placement', () => {
  test.use({
    browserData: {
      ...browser,
      windows: [
        ...browser.windows,
        ...Array.from({ length: 20 }, (_, index) => ({
          ...browser.windows[1],
          id: 100 + index,
          focused: false,
        })),
      ],
    },
  })

  test('repositions an open menu to another item before preserving its new direction', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 640 })
    await page.goto('/tab-manager/index.html')
    const row = (id: number) =>
      page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
    const menu = page.getByRole('menu')
    await row(1).click({ button: 'right', position: { x: 4, y: 4 } })
    await expect(menu).toBeVisible()
    await row(6).click({ button: 'right', position: { x: 4, y: 4 } })
    await expect(menu).toHaveAttribute('data-side', 'top')
    const initial = (await menu.boundingBox())!
    await page.keyboard.press('c')
    await expect(
      page.getByRole('menuitem', { name: 'Back', exact: true }),
    ).toBeVisible()
    await expect(menu).toHaveAttribute('data-side', 'top')
    await expect
      .poll(async () => {
        const bounds = (await menu.boundingBox())!
        return Math.abs(bounds.y + bounds.height - initial.y - initial.height)
      })
      .toBeLessThan(0.5)
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => menu.boundingBox()).toEqual(initial)
  })

  for (const { height, tabId, side, toolbar } of [
    { height: 1000, tabId: 1, side: 'bottom', toolbar: false },
    { height: 640, tabId: 6, side: 'top', toolbar: false },
    { height: 640, tabId: 6, side: 'top', toolbar: true },
  ]) {
    test(`keeps ${toolbar ? 'toolbar' : side + '-opening'} menus steady through short and scrolling submenus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 480, height })
      await page.goto('/tab-manager/index.html')
      const row = page.locator(`[data-tab-id="${tabId}"] [data-tab-option]`)
      if (toolbar) {
        await row.click()
        await page
          .getByRole('button', { name: 'More actions', exact: true })
          .click()
      } else {
        await row.click({ button: 'right' })
      }
      const menu = page.getByRole('menu')
      await expect(menu).toHaveAttribute('data-side', side)
      const initial = (await menu.boundingBox())!
      expect(initial.width).toBe(320)
      for (const key of ['c', 'w']) {
        await page.keyboard.press(key)
        await expect(
          page.getByRole('menuitem', { name: 'Back', exact: true }),
        ).toBeVisible()
        await expect(menu).toHaveAttribute('data-side', side)
        const submenu = (await menu.boundingBox())!
        expect(submenu.width).toBe(initial.width)
        expect(submenu.height).toBeLessThanOrEqual(initial.height)
        expect(submenu.x).toBe(initial.x)
        await expect
          .poll(async () => {
            const bounds = (await menu.boundingBox())!
            return Math.abs(
              (side === 'top' ? bounds.y + bounds.height : bounds.y) -
                (side === 'top' ? initial.y + initial.height : initial.y),
            )
          })
          .toBeLessThan(0.5)
        if (key === 'w') {
          expect(
            await menu.evaluate(
              (element) => element.scrollHeight > element.clientHeight,
            ),
          ).toBe(true)
        }
        await page.keyboard.press('ArrowLeft')
        await expect(
          page.getByRole('menuitem', { name: 'Back', exact: true }),
        ).toHaveCount(0)
        await expect.poll(() => menu.boundingBox()).toEqual(initial)
      }
      await page.keyboard.press('Escape')
      await page.setViewportSize({ width: 280, height: 640 })
      await row.click({ button: 'right' })
      const narrow = (await menu.boundingBox())!
      expect(narrow.x).toBeGreaterThanOrEqual(8)
      expect(narrow.x + narrow.width).toBeLessThanOrEqual(272)
    })
  }
})

test('copies selected URLs and confirms the clipboard count', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  await row(1).click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Copy 1 title or URL', exact: true })
    .click()
  await expect(page.getByRole('menuitem')).toHaveText([
    'Back',
    'Copy 1 URL',
    'Copy 1 title and URL',
    'Copy 1 title',
  ])
  await page.getByRole('menuitem', { name: 'Copy 1 URL', exact: true }).click()
  await expect(
    page.getByText('Copied 1 URL to clipboard', { exact: true }),
  ).toBeVisible()
  const toggle = process.platform === 'darwin' ? 'Meta' : 'Control'
  await row(2).click({ modifiers: [toggle] })
  await row(3).click({ modifiers: [toggle] })
  await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await page
    .getByRole('menuitem', { name: 'Copy 3 titles or URLs', exact: true })
    .click()
  await expect(page.getByRole('menuitem')).toHaveText([
    'Back',
    'Copy 3 URLs',
    'Copy 3 titles and URLs',
    'Copy 3 titles',
  ])
  await page.getByRole('menuitem', { name: 'Copy 3 URLs', exact: true }).click()
  await expect(
    page.getByText('Copied 3 URLs to clipboard', { exact: true }),
  ).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    browser.tabs
      .filter((tab) => [1, 2, 3].includes(tab.id))
      .map((tab) => tab.url)
      .join('\n'),
  )
  await expect(
    page.locator('[data-tab-option][aria-selected="true"]'),
  ).toHaveCount(3)
})

test.describe('cross-window group destinations', () => {
  test.use({
    browserData: {
      ...browser,
      groups: [
        {
          id: 20,
          windowId: 2,
          title: 'Reading queue',
          color: 'green',
          collapsed: false,
        },
        ...browser.groups,
      ],
      tabs: browser.tabs.map((tab) =>
        tab.id === 7 ? { ...tab, groupId: 20 } : tab,
      ),
    },
  })
  test('orders and labels groups and previews the inverse focus action with Shift', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 640 })
    await page.goto('/tab-manager/index.html')
    const row = (id: number) =>
      page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
    const groupMenu = async (id: number) => {
      await row(id).click({ button: 'right' })
      await page
        .getByRole('menuitem', { name: 'Group 1 tab', exact: true })
        .click()
      return page.getByRole('menu', { name: 'Group 1 tab', exact: true })
    }
    const menu = await groupMenu(5)
    const choices = menu
      .locator('[data-action-id]')
      .filter({ hasNotText: 'Back' })
    expect(
      await choices.evaluateAll((items) =>
        items.map((item) => item.getAttribute('data-action-id')),
      ),
    ).toEqual(['10', '20', 'new'])
    const remote = menu.locator('[data-action-id="20"]')
    await expect(remote).toContainText('In Reading room')
    await expect(menu.locator('[data-action-id="10"]')).not.toContainText(
      'In Tabby',
    )
    expect(
      (await menu.locator('[data-action-id="10"]').boundingBox())!.height,
    ).toBe((await remote.boundingBox())!.height)
    expect(
      (await menu.locator('[data-action-id="new"]').boundingBox())!.height,
    ).toBe((await remote.boundingBox())!.height)
    await remote.hover()
    const count = remote.getByText('1', { exact: true })
    const restingCount = await count.boundingBox()
    await page.keyboard.down('Shift')
    await expect(
      remote.getByRole('img', { name: 'Switch windows', exact: true }),
    ).toBeVisible()
    const arrow = await remote
      .locator('[data-window-modifier-action]')
      .boundingBox()
    const shiftedCount = await count.boundingBox()
    expect(arrow!.x + arrow!.width).toBeLessThan(shiftedCount!.x)
    expect(Math.abs(restingCount!.x - shiftedCount!.x)).toBeLessThan(1)
    await page.keyboard.press('ArrowUp')
    await expect(menu.locator('[data-action-id="10"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(remote).toBeFocused()
    await expect(
      remote.getByRole('img', { name: 'Switch windows', exact: true }),
    ).toBeVisible()
    await page.screenshot({
      path: '../../test-results/group-destination-shift-480.png',
    })
    await page.keyboard.up('Shift')
    await expect(remote.locator('[data-window-modifier-action]')).toHaveCount(0)
    await remote.click()
    await expect(row(5)).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('[data-window-picker-trigger]')).toContainText(
      'Reading room',
    )
    expect(
      await page.evaluate(
        async () => (await chrome.windows.getLastFocused()).id,
      ),
    ).toBe(1)
    await page.locator('[data-window-picker-trigger]').click()
    await page.locator('[data-window-choice="1"]').click()
    await page.evaluate(async () => {
      const key = 'preference-storage-key'
      const value = (await chrome.storage.local.get(key))[key]
      await chrome.storage.local.set({
        [key]: { ...value, tabManagerWindowClickBehavior: 'switch' },
      })
    })
    await row(6).focus()
    await page.keyboard.press('g')
    const secondMenu = page.getByRole('menu', {
      name: 'Group 1 tab',
      exact: true,
    })
    await expect(secondMenu).toBeVisible()
    await page.keyboard.down('Shift')
    await expect(
      secondMenu.locator('[data-window-modifier-action]'),
    ).toHaveCount(0)
    await page.keyboard.up('Shift')
    const next = secondMenu.locator('[data-action-id="20"]')
    await secondMenu.locator('[data-action-id="10"]').hover()
    await page.keyboard.press('ArrowDown')
    await expect(next).toBeFocused()
    await page.keyboard.down('Shift')
    await expect(
      next.getByRole('img', { name: 'Stay in this window', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('Enter')
    await page.keyboard.up('Shift')
    await expect(row(6)).toHaveAttribute('aria-selected', 'true')
    expect(
      await page.evaluate(
        async () => (await chrome.windows.getLastFocused()).id,
      ),
    ).toBe(1)
    await page.locator('[data-window-picker-trigger]').click()
    await page.locator('[data-window-choice="1"]').click()
    const follow = (await groupMenu(2)).locator('[data-action-id="20"]')
    await follow.click()
    await expect(row(2)).toHaveAttribute('aria-selected', 'true')
    expect(
      await page.evaluate(
        async () => (await chrome.windows.getLastFocused()).id,
      ),
    ).toBe(2)
    expect(
      await page.evaluate(async () => (await chrome.tabs.get(2)).groupId),
    ).toBe(20)
    await row(7).click({ button: 'right' })
    await page
      .getByRole('menuitem', { name: 'Move 1 tab to window', exact: true })
      .click()
    const newWindow = page.locator('[data-action-id="new"]')
    await newWindow.hover()
    await page.keyboard.down('Shift')
    await expect(
      newWindow.getByRole('img', { name: 'Stay in this window', exact: true }),
    ).toBeVisible()
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('[data-action-id="12"]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(newWindow).toBeFocused()
    await expect(
      newWindow.getByRole('img', { name: 'Stay in this window', exact: true }),
    ).toBeVisible()
    await page.keyboard.up('Shift')
  })
})

test.describe('moving the hosting window’s final tabs', () => {
  test.use({
    browserData: {
      ...browser,
      windows: browser.windows.slice(0, 2),
      groups: [],
      tabs: browser.tabs.filter((tab) => [5, 7].includes(tab.id)),
      preferences: { tabManagerWindowClickBehavior: 'switch' },
    },
  })
  test('shows the follow arrow and follows a closing-window move even with Shift', async ({
    page,
  }) => {
    await page.goto('/tab-manager/index.html')
    await page
      .locator('[data-tab-id="5"] [data-tab-option]')
      .click({ button: 'right' })
    await page
      .getByRole('menuitem', { name: 'Move 1 tab to window', exact: true })
      .click()
    const destination = page.locator('[data-action-id="new"]')
    await destination.hover()
    await page.keyboard.down('Shift')
    await expect(
      destination.getByRole('img', { name: 'Switch windows', exact: true }),
    ).toBeVisible()
    await destination.click({ modifiers: ['Shift'] })
    await page.keyboard.up('Shift')
    const movedWindow = await page.evaluate(
      async () => (await chrome.tabs.get(5)).windowId,
    )
    expect(movedWindow).not.toBe(1)
    expect(
      await page.evaluate(
        async () => (await chrome.windows.getLastFocused()).id,
      ),
    ).toBe(movedWindow)
    await expect(
      page.locator('[data-tab-id="5"] [aria-selected="true"]'),
    ).toBeVisible()
  })
})

test.describe('emptying a window shown from another panel', () => {
  test.use({
    browserData: {
      ...browser,
      followOpenedWindow: false,
      groups: [
        {
          id: 30,
          windowId: 3,
          title: 'Destination',
          color: 'pink',
          collapsed: true,
        },
      ],
      tabs: browser.tabs
        .filter((tab) => tab.windowId !== 2 || tab.id === 7)
        .map((tab) => (tab.id === 103 ? { ...tab, groupId: 30 } : tab)),
      preferences: { tabManagerWindowClickBehavior: 'switch' },
    },
  })
  test('selects and focuses the destination after grouping the final remote tab', async ({
    page,
  }) => {
    await page.goto('/tab-manager/index.html')
    await page.locator('[data-window-picker-trigger]').click()
    await page
      .locator('[data-window-choice="2"]')
      .click({ modifiers: ['Shift'] })
    await page
      .locator('[data-tab-id="7"] [data-tab-option]')
      .click({ button: 'right' })
    await page
      .getByRole('menuitem', { name: 'Group 1 tab', exact: true })
      .click()
    const destination = page.locator('[data-action-id="30"]')
    await destination.hover()
    await page.keyboard.down('Shift')
    await expect(
      destination.getByRole('img', { name: 'Switch windows', exact: true }),
    ).toBeVisible()
    await destination.click({ modifiers: ['Shift'] })
    await page.keyboard.up('Shift')
    await expect(page.locator('[data-window-picker-trigger]')).toContainText(
      'Design explorations',
    )
    await expect(
      page.locator('[data-tab-id="7"] [data-tab-option]'),
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      await page.evaluate(
        async () => (await chrome.windows.getLastFocused()).id,
      ),
    ).toBe(3)
    expect(
      await page.evaluate(async () => (await chrome.tabs.get(7)).groupId),
    ).toBe(30)
  })
})
