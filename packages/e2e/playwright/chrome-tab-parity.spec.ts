import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('creates tabs below, closes exactly one with middle-click, and manages split views', async ({
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
  await row(2).click({ button: 'right' })
  await action('Open in split view').click()
  const pair = page.locator('[data-split-view-id]')
  await expect(pair).toHaveCount(2)
  expect(
    await pair.evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-tab-id')),
    ),
  ).toEqual(['2', '4'])
  await expect(page.getByTitle('Split view 1')).toHaveCount(2)
  const paired = await page.evaluate(async () =>
    (await chrome.tabs.query({ windowId: 1 })).filter((tab) =>
      [2, 4].includes(tab.id!),
    ),
  )
  expect(paired[1]!.index).toBe(paired[0]!.index + 1)
  await row(2).click({ button: 'right' })
  await action('Separate split view').click()
  await expect(pair).toHaveCount(0)
  await row(2).click()
  await row(4).click({ button: 'right' })
  await action('New split view with current tab').click()
  await expect(pair).toHaveCount(2)
  await row(4).click({ button: 'right' })
  await action('Separate split view').click()
  await expect(pair).toHaveCount(0)
  await page.setViewportSize({ width: 320, height: 640 })
  await row(2).focus()
  await page.keyboard.press('Shift+F10')
  await action('Add tab to new split view').click()
  await expect(pair).toHaveCount(2)
  const newPartner = await page.evaluate(
    async () =>
      (await chrome.tabs.query({ windowId: 1 })).find(
        (tab) => tab.title === 'New Tab',
      )!,
  )
  expect(newPartner.groupId).toBe(10)
  await expect(page.getByTitle('Split view 1')).toHaveCount(2)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await row(newPartner.id!).click({ button: 'middle' })
  await expect(pair).toHaveCount(0)
  await expect(row(2)).toBeVisible()
})

test.describe('browsers without split controls', () => {
  test.use({
    browserData: {
      ...browser,
      splitViewSupported: false,
      tabs: browser.tabs.map((tab) =>
        [2, 3].includes(tab.id) ? { ...tab, splitViewId: 0 } : tab,
      ),
    },
  })
  test('shows existing pairs and keeps ordinary tab creation available', async ({
    page,
  }) => {
    await page.goto('/tab-manager/index.html')
    await expect(page.locator('[data-split-view-id="0"]')).toHaveCount(2)
    await page
      .locator('[data-tab-id="2"] [data-tab-option]')
      .click({ button: 'right' })
    await expect(
      page.getByRole('menuitem', { name: /split view/i }),
    ).toHaveCount(0)
    await page
      .getByRole('menuitem', { name: 'New tab below', exact: true })
      .click()
    const created = await page.evaluate(
      async () =>
        (await chrome.tabs.query({ windowId: 1 })).find(
          (tab) => tab.title === 'New Tab',
        )!,
    )
    expect(created.index).toBe(3)
    await expect(page.locator('[data-split-view-id="0"]')).toHaveCount(2)
    await page
      .locator('[data-tab-id="2"] [data-tab-option]')
      .click({ button: 'middle' })
    await expect(page.locator('[data-tab-id="2"]')).toHaveCount(0)
    await expect(page.locator('[data-tab-id="3"]')).toBeVisible()
    await expect(page.locator('[data-split-view-id]')).toHaveCount(0)
  })
})
