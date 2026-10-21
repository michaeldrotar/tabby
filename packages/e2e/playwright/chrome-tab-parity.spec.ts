import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('creates tabs below and closes exactly one with middle-click', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const row = (id: number) =>
    page.locator(`[data-tab-id="${id}"] [data-tab-option]`)
  const action = (name: string) =>
    page.getByRole('menuitem', { name, exact: true })
  await row(2).click({ button: 'right' })
  await action('New tab below').click()
  const created = await page.evaluate(
    async () =>
      (await chrome.tabs.query({})).find((tab) => tab.title === 'New Tab')!,
  )
  expect(created.groupId).toBe(10)
  expect(created.index).toBe(2)
  expect(created.active).toBe(true)
  await expect(row(created.id!)).toBeVisible()
  await row(2).click()
  await row(4).click({ modifiers: ['ControlOrMeta'] })
  await page
    .locator(`[data-tab-id="${created.id!}"] [data-tab-favicon]`)
    .click({ button: 'middle' })
  await expect(row(created.id!)).toHaveCount(0)
  await expect(
    page.locator('[data-tab-option][aria-selected="true"]'),
  ).toHaveCount(2)
  await page.setViewportSize({ width: 320, height: 640 })
  await row(2).click()
  await row(2).focus()
  await page.keyboard.press('Shift+F10')
  await action('New tab below').click()
  const next = await page.evaluate(
    async () =>
      (await chrome.tabs.query({ windowId: 1 })).find(
        (tab) => tab.title === 'New Tab',
      )!,
  )
  expect(next.groupId).toBe(10)
  expect(next.index).toBe(2)
  await expect(row(next.id!)).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
