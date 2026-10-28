import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: browser })

test('switches panes and manages selected downloads through the shared action menu', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const tabsPane = page.getByRole('tab', { name: 'Tabs', exact: true })
  const downloadsPane = page.getByRole('tab', {
    name: 'Downloads',
    exact: true,
  })
  const tab = page.locator('[data-tab-id="2"] [data-tab-option]')
  await tab.click()
  await tabsPane.focus()
  await page.keyboard.press('ArrowRight')
  await expect(downloadsPane).toBeFocused()
  await expect(downloadsPane).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(/read your download history/)).toBeVisible()
  await page
    .getByRole('button', { name: 'Allow downloads', exact: true })
    .click()
  const row = (id: number) => page.locator(`[data-download-id="${id}"]`)
  const option = (id: number) => row(id).getByRole('option')
  const menu = page.getByRole('menu', { name: 'Selection actions' })
  const more = page.getByRole('button', { name: 'More actions', exact: true })
  const run = async (name: string) => {
    await more.click()
    await menu.getByRole('menuitem', { name, exact: true }).click()
  }
  await expect(row(201)).toContainText('Completed · example.com')
  await option(201).click()
  await expect(option(201)).toHaveAttribute('aria-selected', 'true')
  await option(201).click({ button: 'right' })
  await expect(
    menu.getByRole('menuitem', { name: 'Open 1 download', exact: true }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(option(201)).toBeFocused()
  await option(202).click({ modifiers: ['ControlOrMeta'] })
  await expect(
    page.getByRole('status').filter({ hasText: '2 selected' }),
  ).toBeVisible()
  await option(201).click({ button: 'right' })
  await expect(
    menu.getByRole('menuitem', { name: 'Pause 1 download', exact: true }),
  ).toBeVisible()
  await menu
    .getByRole('menuitem', { name: 'Open 1 download', exact: true })
    .click()
  await run('Show 1 download in folder')
  await option(202).click()
  await option(203).click({ modifiers: ['Shift'] })
  await expect(option(202)).toHaveAttribute('aria-selected', 'true')
  await expect(option(203)).toHaveAttribute('aria-selected', 'true')
  await run('Resume 1 download')
  await expect(row(203)).toContainText('Downloading')
  await run('Pause 2 downloads')
  await expect(row(202)).toContainText('Paused')
  await expect(row(203)).toContainText('Paused')
  await page.screenshot({ path: testInfo.outputPath('downloads-pane.png') })
  await page.setViewportSize({ width: 320, height: 640 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  )
  await expect(downloadsPane).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Options', exact: true }),
  ).toBeInViewport()
  await run('Resume 2 downloads')
  await run('Cancel 2 downloads')
  await expect(row(202)).toContainText('Canceled')
  await expect(row(203)).toContainText('Canceled')
  await run('Remove 2 downloads from history')
  await expect(row(202)).toHaveCount(0)
  await expect(row(203)).toHaveCount(0)
  await option(204).focus()
  await page.keyboard.press('Space')
  await page.keyboard.press('Shift+F10')
  await menu
    .getByRole('menuitem', { name: 'Resume 1 download', exact: true })
    .click()
  await expect(row(204)).toContainText('Downloading')
  await option(205).click({ button: 'right' })
  await expect(
    menu.getByRole('menuitem', { name: 'Review in Chrome', exact: true }),
  ).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: /Open/ })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(option(205)).toBeFocused()
  await page.keyboard.press('ControlOrMeta+a')
  await expect(
    page.getByRole('status').filter({ hasText: '3 selected' }),
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('status').filter({ hasText: '0 selected' }),
  ).toBeVisible()
  await option(201).click()
  await run('Remove 1 download from history')
  await expect(row(201)).toHaveCount(0)
  expect(
    await page.evaluate(
      () =>
        (globalThis as unknown as { __TABBY_DOWNLOAD_EFFECTS__: unknown[] })
          .__TABBY_DOWNLOAD_EFFECTS__,
    ),
  ).toEqual([
    { action: 'open', id: 201 },
    { action: 'show', id: 201 },
    { action: 'erase', id: 202 },
    { action: 'erase', id: 203 },
    { action: 'erase', id: 201 },
  ])
  await tabsPane.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  await expect(
    page.getByRole('main', { name: 'Downloads', exact: true }),
  ).toHaveCount(0)
  await downloadsPane.click()
  await page.evaluate(() =>
    chrome.permissions.remove({ permissions: ['downloads', 'downloads.open'] }),
  )
  await expect(page.getByRole('option')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Allow downloads', exact: true }),
  ).toBeVisible()
})

test.describe('declined access', () => {
  test.use({ browserData: { ...browser, denyDownloadPermission: true } })
  test('keeps tab management usable after declining download access', async ({
    page,
  }) => {
    await page.goto('/tab-manager/index.html')
    await page.getByRole('tab', { name: 'Downloads', exact: true }).click()
    await page
      .getByRole('button', { name: 'Allow downloads', exact: true })
      .click()
    await expect(page.getByRole('alert')).toContainText('not granted')
    await page.getByRole('tab', { name: 'Tabs', exact: true }).click()
    await expect(
      page.locator('[data-tab-id="1"] [data-tab-option]'),
    ).toBeVisible()
  })
})
