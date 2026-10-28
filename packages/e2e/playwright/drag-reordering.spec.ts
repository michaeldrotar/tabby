import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'
import type { Locator, Page } from '@playwright/test'

const tabs = (windowId: number, first: number, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: first + index,
    windowId,
    title: `${windowId === 1 ? 'Source' : 'Destination'} ${index + 1}`,
    url: `https://example.com/${first + index}`,
    active: index === 0,
    pinned: index === 0,
    groupId: index >= 1 && index <= 3 ? windowId * 10 : -1,
  }))
test.use({
  browserData: {
    ...browser,
    tabs: [
      ...tabs(1, 1, 24),
      ...tabs(2, 101, 20),
      ...browser.tabs.filter((tab) => tab.windowId > 2),
    ],
    groups: [
      {
        id: 10,
        windowId: 1,
        title: 'Source group',
        color: 'blue',
        collapsed: false,
      },
      {
        id: 20,
        windowId: 2,
        title: 'Destination group',
        color: 'green',
        collapsed: true,
      },
    ],
  },
})
const row = (page: Page, id: number) =>
  page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
const point = async (locator: Locator, fraction = 0.5) => {
  let previous: string | undefined
  await expect
    .poll(async () => {
      const next = JSON.stringify(await locator.boundingBox())
      const stable = next === previous
      previous = next
      return stable
    })
    .toBe(true)
  const bounds = await locator.boundingBox()
  if (!bounds) throw new Error('Missing drag target')
  return { x: bounds.x + 30, y: bounds.y + bounds.height * fraction }
}
const begin = async (page: Page, source: Locator) => {
  await source.scrollIntoViewIfNeeded()
  const origin = await point(source)
  await page.mouse.move(origin.x, origin.y)
  await page.mouse.down()
  await page.mouse.move(origin.x + 10, origin.y, { steps: 3 })
  await expect(page.locator('[data-drag-preview]')).toBeVisible()
}
const over = async (page: Page, target: Locator, fraction = 0.5) => {
  await page.mouse.move(1, 1)
  await target.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' }),
  )
  const at = await point(target, fraction)
  await page.mouse.move(at.x, at.y, { steps: 8 })
}
const atTopOf = async (page: Page, anchor: Locator) => {
  await expect
    .poll(async () => {
      const line = await page.locator('[data-drop-indicator]').boundingBox()
      const bounds = await anchor.boundingBox()
      return line && bounds ? Math.abs(line.y - bounds.y) : Infinity
    })
    .toBeLessThan(1)
}
const openWindows = async (page: Page) => {
  await over(page, page.locator('[data-window-picker-trigger]'))
  await expect(page.locator('[data-drag-reveal="true"]')).toBeVisible()
  await expect(page.locator('[data-window-picker]')).toBeVisible()
}
const order = (page: Page, windowId: number) =>
  page.evaluate(
    async (windowId) =>
      (await chrome.tabs.query({ windowId })).map((tab) => tab.id),
    windowId,
  )

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  await expect(row(page, 2)).toBeVisible()
})

for (const pinned of [false, true]) {
  test.describe(`current slot with two ${pinned ? 'pinned ' : ''}tabs`, () => {
    test.use({
      browserData: {
        ...browser,
        windows: browser.windows.slice(0, 1),
        groups: [],
        tabs: tabs(1, 1, pinned ? 3 : 2).map((tab, index) => ({
          ...tab,
          groupId: -1,
          pinned: pinned && index < 2,
        })),
      },
    })
    test('shows the insertion line between the tabs while dragging the second tab back to its current slot', async ({
      page,
    }) => {
      const second = page.locator('[data-tab-id="2"]')
      await begin(page, row(page, 2))
      await over(page, row(page, 2), 0.1)
      await atTopOf(page, second)
      await over(page, row(page, 1), 0.9)
      await atTopOf(page, second)
      const firstBounds = (await row(page, 1).boundingBox())!
      const secondBounds = (await row(page, 2).boundingBox())!
      await page.mouse.move(
        firstBounds.x + 30,
        (firstBounds.y + firstBounds.height + secondBounds.y) / 2,
      )
      await atTopOf(page, second)
      await page.screenshot({
        path: `../../test-results/drag-current-slot-${pinned ? 'pinned' : 'unpinned'}.png`,
      })
      await page.mouse.up()
      expect(await order(page, 1)).toEqual(pinned ? [1, 2, 3] : [1, 2])
      await expect(row(page, 2)).toHaveAttribute('aria-selected', 'true')
    })
  })
}

test.describe('upward dragging in a two-tab group', () => {
  test.use({
    browserData: {
      ...browser,
      windows: browser.windows.slice(0, 1),
      groups: browser.groups.filter((group) => group.id === 10),
      tabs: tabs(1, 1, 4).map((tab) => ({
        ...tab,
        groupId: tab.id === 2 || tab.id === 3 ? 10 : -1,
      })),
    },
  })
  test('keeps the indicator moving upward through the first tab and group header', async ({
    page,
  }) => {
    const group = page.locator('[data-group-id="10"]')
    const header = group.locator('[data-group-header]')
    const first = page.locator('[data-tab-id="2"]')
    for (const sourceId of [3, 2]) {
      await begin(page, row(page, sourceId))
      if (sourceId === 3) {
        await over(page, row(page, 3), 0.1)
        await atTopOf(page, page.locator('[data-tab-id="3"]'))
      }
      await over(page, row(page, 2), 0.1)
      await atTopOf(page, first)
      await over(page, header, 0.9)
      await atTopOf(page, first)
      if (sourceId === 2)
        await page.screenshot({
          path: '../../test-results/drag-group-header.png',
        })
      await over(page, header, 0.1)
      await atTopOf(page, group)
      if (sourceId === 3) await page.keyboard.press('Escape')
      await page.mouse.up()
    }
    await expect.poll(() => order(page, 1)).toEqual([1, 2, 3, 4])
    expect((await page.evaluate(() => chrome.tabs.get(2))).groupId).toBe(-1)
    await expect(group.locator('[data-tab-id]')).toHaveCount(1)
    await expect(group.locator('[data-tab-id="3"]')).toBeVisible()
  })
})

test('reorders a selection, respects pinned boundaries, and temporarily reveals a collapsed group', async ({
  page,
}) => {
  await row(page, 5).click({ modifiers: ['ControlOrMeta'] })
  await row(page, 6).click({ modifiers: ['ControlOrMeta'] })
  // Clear the default pinned selection, leaving the two dragged tabs selected.
  await row(page, 1).click({ modifiers: ['ControlOrMeta'] })
  await begin(page, row(page, 5))
  await expect(page.locator('[data-drag-preview] > div').first()).toHaveText(
    '2 tabs',
  )
  await expect(page.locator('[data-drag-preview] > div').nth(1)).toHaveText(
    'Source 5, Source 6',
  )
  const indicator = page.locator('[data-drop-indicator]')
  const sameInsertionLine = async (previous: Locator, next: Locator) => {
    await previous.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    )
    const below = await point(previous, 0.9)
    const above = await point(next, 0.1)
    await page.mouse.move(below.x, below.y, { steps: 4 })
    await expect(indicator).toBeVisible()
    await expect
      .poll(async () => {
        const line = await indicator.boundingBox()
        const insertionTop = await next.evaluate(
          (element) =>
            (
              element.closest('[data-tab-id]') ?? element
            ).getBoundingClientRect().top,
        )
        return line ? Math.abs(line.y - insertionTop) : Infinity
      })
      .toBeLessThan(1)
    const line = (await indicator.boundingBox())!
    const previousBounds = (await previous.boundingBox())!
    const nextBounds = (await next.boundingBox())!
    await page.mouse.move(
      below.x,
      (previousBounds.y + previousBounds.height + nextBounds.y) / 2,
    )
    await expect.poll(() => indicator.boundingBox()).toEqual(line)
    await page.mouse.move(above.x, above.y, { steps: 4 })
    await expect.poll(() => indicator.boundingBox()).toEqual(line)
  }
  await sameInsertionLine(row(page, 2), row(page, 3))
  await sameInsertionLine(
    row(page, 4),
    page.getByRole('button', { name: 'New tab in Source group', exact: true }),
  )
  await sameInsertionLine(row(page, 8), row(page, 9))
  await sameInsertionLine(
    row(page, 24),
    page.getByRole('button', { name: 'New tab', exact: true }),
  )
  await page.screenshot({ path: '../../test-results/drag-insertion-line.png' })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await begin(page, row(page, 5))
  await page.mouse.up()
  expect((await order(page, 1)).slice(0, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  await begin(page, row(page, 5))
  await over(page, row(page, 1), 0.1)
  await expect(page.locator('[data-drop-indicator]')).toBeVisible()
  await expect(page.locator('[data-drag-preview]')).not.toContainText(
    'after pinned',
  )
  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect((await order(page, 1)).slice(0, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])

  await begin(page, row(page, 5))
  await over(page, row(page, 2), 0.1)
  await expect(page.locator('[data-drop-indicator]')).toBeVisible()
  await page.mouse.up()
  expect((await order(page, 1)).slice(0, 7)).toEqual([1, 5, 6, 2, 3, 4, 7])
  await expect(row(page, 5)).toHaveCount(1)
  await expect(row(page, 5)).toHaveAttribute('aria-selected', 'true')
  await expect(row(page, 6)).toHaveAttribute('aria-selected', 'true')
  expect((await page.evaluate(() => chrome.tabs.get(5))).groupId).toBe(10)

  await page
    .getByRole('button', { name: 'Collapse group Source group' })
    .click()
  await begin(page, row(page, 7))
  await over(page, page.locator('[data-group-id="10"] [data-group-header]'))
  await expect(page.locator('[data-drag-reveal="true"]')).toBeVisible()
  await expect(row(page, 2)).toBeVisible()
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(row(page, 2)).toHaveCount(0)
  expect((await page.evaluate(() => chrome.tabGroups.get(10))).collapsed).toBe(
    true,
  )
  await begin(page, row(page, 7))
  await over(page, page.locator('[data-group-id="10"] [data-group-header]'))
  await expect(row(page, 2)).toBeVisible()
  await over(page, row(page, 2), 0.1)
  const collapseAudit = page.evaluate(async () => {
    const group = document.querySelector('[data-group-id="10"]')!
    const changes: (string | null)[] = []
    const observer = new MutationObserver((records) =>
      changes.push(...records.map((record) => record.oldValue)),
    )
    observer.observe(group, {
      attributes: true,
      attributeFilter: ['data-collapsed'],
      attributeOldValue: true,
    })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    observer.disconnect()
    return changes
  })
  await page.mouse.up()
  await expect(row(page, 7)).toHaveCount(1)
  await expect(row(page, 7)).toBeVisible()
  await expect(row(page, 7)).toHaveAttribute('aria-selected', 'true')
  expect((await page.evaluate(() => chrome.tabGroups.get(10))).collapsed).toBe(
    false,
  )
  expect(await collapseAudit).toEqual([])
})

test('summarizes mixed drags and keeps pinned boundaries visible and valid', async ({
  page,
}) => {
  const group = page.locator('[data-group-id="10"]')
  const pin = page.locator('[data-tab-id="1"] [data-tab-pin]')
  const normalPinColor = await pin.evaluate(
    (node) => getComputedStyle(node).color,
  )
  const cancel = async () => {
    await page.keyboard.press('Escape')
    await page.mouse.up()
  }
  await row(page, 5).click()
  await group
    .locator('[data-group-option]')
    .click({ modifiers: ['ControlOrMeta'] })
  await begin(page, row(page, 5))
  const preview = page.locator('[data-drag-preview]')
  await expect(preview.locator(':scope > div').first()).toHaveText(
    '1 tab and 1 tab group',
  )
  await expect(preview.locator(':scope > div').nth(1)).toHaveText(
    'Source group, Source 5',
  )
  expect(
    await preview
      .locator(':scope > div')
      .nth(1)
      .evaluate((node) => getComputedStyle(node).fontSize),
  ).toBe('12px')
  expect(
    await page
      .locator('[data-tab-id="1"] [data-tab-details]')
      .evaluate((node) => getComputedStyle(node).opacity),
  ).toBe('0.35')
  expect(await pin.evaluate((node) => getComputedStyle(node).color)).not.toBe(
    normalPinColor,
  )
  for (const fraction of [0.1, 0.9]) {
    await over(page, row(page, 1), fraction)
    await atTopOf(page, group)
  }
  await page.screenshot({ path: '../../test-results/drag-mixed-preview.png' })
  await cancel()
  expect(await pin.evaluate((node) => getComputedStyle(node).color)).toBe(
    normalPinColor,
  )

  await begin(page, row(page, 1))
  await expect(page.locator('[data-tab-id="2"] > div')).toHaveCSS(
    'opacity',
    '0.35',
  )
  expect(
    await group
      .locator('[data-group-header]')
      .evaluate((node) => getComputedStyle(node).opacity),
  ).toBe('0.35')
  expect(await pin.evaluate((node) => getComputedStyle(node).color)).not.toBe(
    normalPinColor,
  )
  await over(page, group.locator('[data-group-header]'))
  await atTopOf(page, group)
  await over(page, row(page, 7))
  await atTopOf(page, group)
  await page.screenshot({ path: '../../test-results/drag-pinned-boundary.png' })
  await page.mouse.up()
  expect((await order(page, 1)).slice(0, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  await expect(page.locator('[data-tab-id="2"] > div')).toHaveCSS(
    'opacity',
    '1',
  )

  await begin(page, row(page, 7))
  await over(page, row(page, 1), 0.1)
  await atTopOf(page, group)
  await page.mouse.up()
  expect((await order(page, 1)).slice(0, 7)).toEqual([1, 7, 2, 3, 4, 5, 6])
})

test('cancels a window move, then drops, follows, and reorders in the destination', async ({
  page,
}) => {
  await row(page, 5).focus()
  await begin(page, row(page, 5))
  await expect(page.locator('[data-drag-preview]')).toHaveText('Source 5')
  await openWindows(page)
  await over(page, page.locator('[data-window-choice="2"]'))
  await expect(page.locator('[data-drop-indicator]')).toBeHidden()
  await page.screenshot({ path: '../../test-results/drag-window-targets.png' })
  expect(
    await page.evaluate(async () => (await chrome.windows.getLastFocused()).id),
  ).toBe(1)
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'Tabby',
  )
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(row(page, 5)).toBeFocused()
  expect((await page.evaluate(() => chrome.tabs.get(5))).windowId).toBe(1)

  await begin(page, row(page, 5))
  await openWindows(page)
  await over(page, page.locator('[data-window-choice="2"]'))
  await page.mouse.up()
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'Reading room',
  )
  await expect(row(page, 5)).toHaveAttribute('aria-selected', 'true')
  await expect(row(page, 5)).toBeInViewport()
  await expect(row(page, 5)).toBeFocused()
  expect((await order(page, 2)).at(-1)).toBe(5)

  await begin(page, row(page, 5))
  await over(page, row(page, 105), 0.1)
  await expect(page.locator('[data-drop-indicator]')).toBeVisible()
  await page.mouse.up()
  expect((await order(page, 2)).slice(0, 6)).toEqual([
    101, 102, 103, 104, 5, 105,
  ])
  expect(
    await page.evaluate(async () => (await chrome.windows.getLastFocused()).id),
  ).toBe(2)

  await begin(page, row(page, 5))
  await openWindows(page)
  await over(page, page.locator('[data-window-choice="1"]'))
  await page.mouse.up()
  await expect(row(page, 5)).toHaveAttribute('aria-selected', 'true')
  expect((await page.evaluate(() => chrome.tabs.get(5))).windowId).toBe(1)
  await expect(row(page, 5)).toBeInViewport()
  await expect(row(page, 5)).toBeFocused()
  await begin(page, row(page, 5))
  await openWindows(page)
  await over(page, page.locator('[data-window-picker-trigger]'))
  await page.mouse.up()
  await expect(page.locator('[data-window-picker]')).toHaveCount(0)
  expect((await page.evaluate(() => chrome.tabs.get(5))).windowId).toBe(1)
})

test('scrolls tab and window lists at their edges and creates a new window on drop', async ({
  page,
}) => {
  const scroll = page.locator(
    '[data-manager-scroll] [data-radix-scroll-area-viewport]',
  )
  await begin(page, row(page, 5))
  const bounds = await scroll.boundingBox()
  await page.mouse.move(220, bounds!.y + bounds!.height - 3)
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(120)
  await page.mouse.move(220, bounds!.y + 3)
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBeLessThan(10)
  await openWindows(page)
  await page.mouse.move(220, bounds!.y + bounds!.height - 3)
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(120)
  await expect(page.locator('[data-window-picker]')).toBeVisible()
  await page.mouse.move(220, bounds!.y + bounds!.height - 3)
  await expect(page.locator('[data-new-window]')).toBeInViewport()
  const newWindow = page.locator('[data-new-window]')
  await page.mouse.move(0, 0)
  const idleBackground = await newWindow.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )
  await over(page, page.locator('[data-new-window]'))
  await expect
    .poll(() =>
      newWindow.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    )
    .not.toBe(idleBackground)
  await expect(page.locator('[data-drop-indicator]')).toBeHidden()
  await page.screenshot({
    path: '../../test-results/drag-new-window-target.png',
  })
  await page.mouse.up()
  await expect(row(page, 5)).toHaveAttribute('aria-selected', 'true')
  const moved = await page.evaluate(() => chrome.tabs.get(5))
  expect(moved.windowId).toBeGreaterThan(12)
  expect(
    await page.evaluate(async () => (await chrome.windows.getLastFocused()).id),
  ).toBe(moved.windowId)
  const current = page.locator(`[data-window-choice="${moved.windowId}"]`)
  await page.locator('[data-window-picker-trigger]').click()
  await expect(current).toBeFocused()
  await expect(current).toBeInViewport()
  await page.keyboard.press('Escape')
  await begin(page, row(page, 5))
  await openWindows(page)
  await expect(current).toHaveAttribute('aria-current', 'true')
  await expect(current).toBeInViewport()
  expect(
    await current.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).not.toBe('rgba(0, 0, 0, 0)')
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(row(page, 5)).toBeFocused()
})

test('keeps the drop-time viewport after dragging from the end of a long list', async ({
  page,
}) => {
  const scroll = page.locator(
    '[data-manager-scroll] [data-radix-scroll-area-viewport]',
  )
  await begin(page, row(page, 24))
  const bounds = (await scroll.boundingBox())!
  await page.mouse.move(220, bounds.y + 3)
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBeLessThan(10)
  await over(page, row(page, 5), 0.1)
  const top = await scroll.evaluate((element) => element.scrollTop)
  await page.mouse.up()
  await expect(row(page, 24)).toHaveAttribute('aria-selected', 'true')
  expect((await order(page, 1)).slice(0, 6)).toEqual([1, 2, 3, 4, 24, 5])
  await expect
    .poll(() =>
      scroll.evaluate(
        (element, dropTop) => Math.abs(element.scrollTop - dropTop),
        top,
      ),
    )
    .toBeLessThan(2)
})

test('uses continuous group boundaries and two header drop zones', async ({
  page,
}) => {
  const group = page.locator('[data-group-id="10"]')
  const header = group.locator('[data-group-header]')
  await begin(page, row(page, 7))
  await over(page, header, 0.1)
  await atTopOf(page, group)
  await over(page, header, 0.9)
  await atTopOf(page, page.locator('[data-tab-id="2"]'))
  const head = (await header.boundingBox())!
  const first = (await row(page, 2).boundingBox())!
  await page.mouse.move(head.x + 30, (head.y + head.height + first.y) / 2)
  await atTopOf(page, page.locator('[data-tab-id="2"]'))
  const above = (await row(page, 1).boundingBox())!
  const bounds = (await group.boundingBox())!
  await page.mouse.move(above.x + 30, (above.y + above.height + bounds.y) / 2)
  await atTopOf(page, group)
  const next = (await row(page, 5).boundingBox())!
  await page.mouse.move(next.x + 30, (bounds.y + bounds.height + next.y) / 2)
  await atTopOf(page, page.locator('[data-tab-id="5"]'))
  await over(page, header, 0.9)
  await page.mouse.up()
  await expect
    .poll(() => order(page, 1))
    .toEqual([
      1,
      7,
      2,
      3,
      4,
      5,
      6,
      ...Array.from({ length: 17 }, (_, i) => i + 8),
    ])
  expect((await page.evaluate(() => chrome.tabs.get(7))).groupId).toBe(10)

  await page
    .getByRole('button', { name: 'Collapse group Source group', exact: true })
    .click()
  await expect(row(page, 2)).toHaveCount(0)
  await begin(page, row(page, 8))
  await over(page, header, 0.9)
  await atTopOf(page, page.locator('[data-tab-id="5"]'))
  await page.mouse.up()
  expect((await page.evaluate(() => chrome.tabs.get(8))).groupId).toBe(-1)
  expect((await order(page, 1)).slice(0, 7)).toEqual([1, 7, 2, 3, 4, 8, 5])

  await begin(page, row(page, 9))
  await over(page, header)
  await expect(row(page, 2)).toBeVisible()
  await over(page, row(page, 6), 0.1)
  await page.mouse.up()
  await expect(row(page, 2)).toHaveCount(0)
  expect((await page.evaluate(() => chrome.tabGroups.get(10))).collapsed).toBe(
    true,
  )
  const groupHeader = group.locator('[data-group-option]')
  await begin(page, groupHeader)
  await expect(page.locator('[data-drag-preview]')).toHaveText('Source group')
  await over(page, row(page, 6), 0.1)
  const viewport = page.locator(
    '[data-manager-scroll] [data-radix-scroll-area-viewport]',
  )
  const dropScroll = await viewport.evaluate((element) => element.scrollTop)
  await page.mouse.up()
  await expect
    .poll(() => order(page, 1))
    .toEqual([
      1,
      8,
      5,
      9,
      7,
      2,
      3,
      4,
      6,
      ...Array.from({ length: 15 }, (_, i) => i + 10),
    ])
  expect((await page.evaluate(() => chrome.tabGroups.get(10))).collapsed).toBe(
    true,
  )
  await expect(row(page, 2)).toHaveCount(0)
  await expect(groupHeader).toBeFocused()
  expect(await viewport.evaluate((element) => element.scrollTop)).toBe(
    dropScroll,
  )
})
