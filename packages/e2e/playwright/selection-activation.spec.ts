import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

const sampleTab = (
  id: number,
  title: string,
  options: Partial<(typeof browser.tabs)[number]> = {},
) => ({ ...browser.tabs[4]!, id, title, ...options })
test.use({
  browserData: {
    ...browser,
    windows: browser.windows.slice(0, 2),
    preferences: { theme: 'system' },
    groups: [
      { ...browser.groups[0]!, title: 'Selection group', collapsed: true },
    ],
    tabs: [
      sampleTab(1, 'Initial tab', { active: true }),
      sampleTab(11, 'Selection loaded'),
      sampleTab(12, 'Selection secondary', { discarded: true }),
      sampleTab(13, 'Selection grouped', { groupId: 10 }),
      sampleTab(14, 'Selection group last', { groupId: 10 }),
      sampleTab(21, 'Selection other', { windowId: 2, active: true }),
    ],
  },
})

test('activates row clicks, supports modifier selection and empty actions, and recovers after external changes', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const selected = page.locator('[data-tab-option][aria-selected="true"]')
  await expect(row(1)).toHaveAttribute('aria-selected', 'true')
  await row(12).click({ modifiers: ['ControlOrMeta'] })
  expect(
    await page.evaluate(async () => ({
      active: (await chrome.tabs.get(12)).active,
      discarded: (await chrome.tabs.get(12)).discarded,
    })),
  ).toEqual({ active: false, discarded: true })
  await expect(page.locator('[data-tab-activate]')).toHaveCount(0)
  await page.locator('[data-tab-id="12"] [data-tab-favicon]').click()
  await expect
    .poll(() => page.evaluate(async () => (await chrome.tabs.get(12)).active))
    .toBe(true)
  await expect
    .poll(() =>
      page.evaluate(async () => (await chrome.tabs.get(12)).discarded),
    )
    .toBe(false)
  await expect(selected).toHaveCount(1)
  await row(12).click({ button: 'right', position: { x: 8, y: 4 } })
  const actions = page.getByRole('menu', { name: 'Selection actions' })
  await expect(actions).toBeFocused()
  const move = actions.getByRole('menuitem', { name: 'Move 1 tab to window' })
  await move.hover()
  await expect(move).toHaveAttribute('data-highlighted', '')
  await move.click()
  const destinations = page.getByRole('menu', { name: 'Move 1 tab to window' })
  await expect(destinations.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(destinations).toHaveCount(0)
  await row(11).click({ modifiers: ['Shift'] })
  await expect(selected).toHaveCount(2)
  await expect
    .poll(() => page.evaluate(async () => (await chrome.tabs.get(12)).active))
    .toBe(true)
  await row(11).click()
  await expect
    .poll(() => page.evaluate(async () => (await chrome.tabs.get(11)).active))
    .toBe(true)
  await expect(selected).toHaveCount(1)
  await row(11).click({ modifiers: ['ControlOrMeta'] })
  await expect(selected).toHaveCount(0)
  await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await expect(
    page.getByText('Select tabs or groups to see actions.', { exact: true }),
  ).toBeVisible()
  const emptyMenu = page.getByRole('menu', { name: 'Selection actions' })
  await expect(emptyMenu.getByRole('status').locator('svg')).toBeVisible()
  const emptyBounds = await emptyMenu.boundingBox()
  expect(emptyBounds!.width).toBeGreaterThanOrEqual(220)
  expect(Math.abs(emptyBounds!.width - emptyBounds!.height)).toBeLessThan(2)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'More actions' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(row(11)).toHaveAttribute('aria-selected', 'true')
  await page
    .getByRole('button', { name: 'Expand group Selection group' })
    .click()
  await page
    .getByRole('button', { name: 'Selection group', exact: true })
    .click()
  await expect(selected).toHaveCount(2)
  await row(13).click({ modifiers: ['ControlOrMeta'] })
  await expect(selected).toHaveCount(1)
  await expect(row(14)).toHaveAttribute('aria-selected', 'true')
  await page.evaluate(async () => {
    await chrome.tabs.move(14, { windowId: 2, index: -1 })
  })
  await expect(row(14)).toHaveCount(0)
  await expect(row(11)).toHaveAttribute('aria-selected', 'true')
  await row(11).focus()
  await page.evaluate(async () => {
    await chrome.windows.remove(1)
  })
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'Reading room',
  )
  await expect(row(21)).toBeFocused()
  await expect(row(14)).toBeVisible()
  await expect(row(21)).toHaveAttribute('aria-selected', 'true')
})
