import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

const sourceBounds = { left: -1200, top: 40, width: 1100, height: 800 }
const destinationBounds = { left: 200, top: 100, width: 700, height: 500 }
const fixture = {
  ...browser,
  followOpenedWindow: false,
  windows: browser.windows.slice(0, 2).map((window) => ({
    ...window,
    ...(window.id === 1 ? sourceBounds : destinationBounds),
  })),
  tabs: browser.tabs.filter((tab) => tab.windowId <= 2),
  groups: browser.groups.filter((group) => group.windowId <= 2),
  preferences: { theme: 'system' as const, stackWindows: true },
}
test.use({ browserData: fixture })

test('stacks switched windows and followed moves while leaving in-place moves alone', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const picker = page.locator('[data-window-picker-trigger]')
  const destination = () => page.evaluate(() => chrome.windows.get(2))
  await picker.click()
  await page.locator('[data-window-choice="2"]').click()
  expect(await destination()).toMatchObject({
    ...destinationBounds,
    focused: false,
  })
  await page.evaluate(() =>
    chrome.storage.local.set({
      'preference-storage-key': {
        stackWindows: true,
        tabManagerWindowClickBehavior: 'switch',
      },
    }),
  )
  await page
    .locator('[data-tab-id="7"] [data-tab-option]')
    .click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Group 1 tab', exact: true }).click()
  await page
    .getByRole('menu', { name: 'Group 1 tab', exact: true })
    .locator('[data-action-id="new"]')
    .click()
  await expect
    .poll(() => page.evaluate(async () => (await chrome.tabs.get(7)).groupId))
    .not.toBe(-1)
  expect(await destination()).toMatchObject({
    ...destinationBounds,
    focused: false,
  })
  await page.evaluate(() =>
    chrome.storage.local.set({
      'preference-storage-key': {
        stackWindows: true,
        tabManagerWindowClickBehavior: 'view',
      },
    }),
  )
  await picker.click()
  await page.locator('[data-window-choice="2"]').click({ modifiers: ['Shift'] })
  await expect
    .poll(destination)
    .toMatchObject({ ...sourceBounds, focused: true })

  await page.evaluate(async (bounds) => {
    await chrome.windows.update(1, { focused: true })
    await chrome.windows.update(2, bounds)
  }, destinationBounds)
  await page
    .locator('[data-group-id="10"] [data-group-option]')
    .click({ button: 'right' })
  await page
    .getByRole('menuitem', { name: 'Move tab group to window', exact: true })
    .click()
  await page
    .getByRole('menu', { name: 'Move tab group to window', exact: true })
    .locator('[data-action-id="2"]')
    .click({ modifiers: ['Shift'] })
  await expect
    .poll(() => page.evaluate(() => chrome.tabGroups.get(10)))
    .toMatchObject({ windowId: 2 })
  await expect
    .poll(destination)
    .toMatchObject({ ...sourceBounds, focused: true })

  await page.evaluate(async (bounds) => {
    await chrome.windows.update(1, { focused: true })
    await chrome.windows.update(2, bounds)
  }, destinationBounds)
  const move = async (tabId: number, follow: boolean) => {
    await page
      .locator(`[data-tab-id="${tabId}"] [data-tab-option]`)
      .click({ button: 'right' })
    await page
      .getByRole('menuitem', { name: 'Move 1 tab to window', exact: true })
      .click()
    await page
      .getByRole('menu', { name: 'Move 1 tab to window' })
      .locator('[data-action-id="2"]')
      .click({ modifiers: follow ? ['Shift'] : [] })
    await expect
      .poll(() => page.evaluate((id) => chrome.tabs.get(id), tabId))
      .toMatchObject({ windowId: 2 })
  }
  await move(6, false)
  expect(await destination()).toMatchObject({
    ...destinationBounds,
    focused: false,
  })
  await move(5, true)
  await expect
    .poll(destination)
    .toMatchObject({ ...sourceBounds, focused: true })

  await page.evaluate(async (bounds) => {
    await chrome.windows.update(1, { focused: true })
    await chrome.windows.update(2, bounds)
    const key = 'preference-storage-key'
    const stored = (await chrome.storage.local.get(key))[key]
    await chrome.storage.local.set({
      [key]: { ...stored, stackWindows: false },
    })
  }, destinationBounds)
  await picker.click()
  await page.locator('[data-window-choice="2"]').click({ modifiers: ['Shift'] })
  await expect
    .poll(destination)
    .toMatchObject({ ...destinationBounds, focused: true })
})

test('stacks a window opened from search', async ({ page }) => {
  await page.goto('/omnibar/index.html?originalWindowId=1')
  await page.evaluate(() => {
    window.close = () => undefined
  })
  await page.getByRole('combobox').fill('Reading room')
  await page
    .getByRole('option')
    .filter({ hasText: 'Reading room' })
    .first()
    .click()
  await expect
    .poll(() => page.evaluate(() => chrome.windows.get(2)))
    .toMatchObject({ ...sourceBounds, focused: true })
})

test.describe('closing the source window', () => {
  test.use({
    browserData: {
      ...fixture,
      tabs: [browser.tabs[5], browser.tabs[6]],
      groups: [],
    },
  })

  test('stacks a newly created destination using the closed source bounds', async ({
    page,
  }) => {
    await page.goto('/tab-manager/index.html')
    await page
      .locator('[data-tab-id="6"] [data-tab-option]')
      .click({ button: 'right' })
    await page
      .getByRole('menuitem', { name: 'Move 1 tab to window', exact: true })
      .click()
    await page
      .getByRole('menu', { name: 'Move 1 tab to window' })
      .locator('[data-action-id="new"]')
      .click()
    await expect
      .poll(() => page.evaluate(() => chrome.windows.getAll()))
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 3, ...sourceBounds, focused: true }),
        ]),
      )
    expect(await page.evaluate(() => chrome.windows.getAll())).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 1 })]),
    )
    expect(await page.evaluate(() => chrome.tabs.get(6))).toMatchObject({
      windowId: 3,
    })
  })
})
