import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('switches Chrome windows, keeps selection local, and transitions right-click actions beside the cursor and toggles the menu button', async ({
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
    await expect
      .poll(() =>
        page.evaluate(async () => (await chrome.windows.getLastFocused()).id),
      )
      .toBe(id)
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
  await destinations.getByRole('menuitem', { name: /Reading room/ }).click()
  await expect(row(2)).toHaveCount(0)
  await expect(row(4)).toHaveCount(0)
  await expect(switcher).toContainText('Tabby')
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

test('moves a whole group through a submenu and closes duplicates in other windows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const group = page.locator('[data-group-id="10"] [data-group-option]')
  await group.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('ArrowDown')
  await expect(row(5)).toBeFocused()
  await group.focus()
  await page.keyboard.press('Enter')
  await expect(row(2)).toBeVisible()
  await row(2).click({ button: 'right' })
  const remove = page.getByRole('menuitem', {
    name: 'Close 2 duplicates',
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
  await expect(row(2)).toHaveCount(0)
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'Tabby',
  )
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
