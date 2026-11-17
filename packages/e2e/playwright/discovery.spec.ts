import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({
  browserData: { ...browser, followOpenedWindow: true, discovery: {} },
})

test('paces guidance and offers a reversible window default after repeated use', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const tour = page.getByRole('dialog')
  await expect(tour).toContainText('1 of 3')
  await expect(tour.getByRole('button', { name: 'Next' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(tour.getByRole('button', { name: 'Skip tour' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Enter')
  await expect(tour).toContainText('2 of 3')
  await page.setViewportSize({ width: 320, height: 480 })
  await expect
    .poll(async () => {
      const card = (await page
        .locator('[data-walkthrough-card]')
        .boundingBox())!
      return card.x + card.width
    })
    .toBeLessThanOrEqual(320)
  const bounds = (await page.locator('[data-walkthrough-card]').boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.y).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(480)
  await page.screenshot({
    path: '../../test-results/discovery-manager-320.png',
  })
  await tour.getByRole('button', { name: 'Next' }).click()
  await tour.getByRole('button', { name: 'Done' }).click()
  await expect(tour).toHaveCount(0)
  await page.locator('[data-window-picker-trigger]').click()
  await expect(page.getByLabel('Tabby tip')).toHaveCount(0)
  await page.keyboard.press('Escape')

  // A returning user's local counters represent repeated actions on separate days.
  await page.evaluate(async () => {
    const date = new Date()
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    await chrome.storage.local.set({
      'tabby-discovery-usage': {
        firstAt: Date.now() - 7 * 86400000,
        days: ['earlier-1', 'earlier-2', today],
      },
      'tabby-discovery-quiet-day': null,
      'tabby-discovery-tip-follow-windows': {
        uses: 2,
        days: ['earlier-1', 'earlier-2'],
      },
    })
  })
  await page.setViewportSize({ width: 480, height: 640 })
  const tab = page.locator('[data-tab-id="2"] [data-tab-option]')
  await tab.click()
  await page.keyboard.press('w')
  const destination = page.getByRole('menuitem', { name: /Reading room/ })
  await expect(destination).toBeVisible()
  await page.keyboard.down('Shift')
  await destination.click()
  await page.keyboard.up('Shift')
  const tip = page.getByLabel('Tabby tip')
  await expect(tip).toContainText('Make switching windows the default')
  await expect(tip).toBeInViewport()
  await expect(tip.getByRole('link', { name: 'Open options' })).toBeVisible()
  await page.screenshot({ path: '../../test-results/discovery-follow-tip.png' })
  await tip.getByRole('button', { name: 'Always switch windows' }).click()
  const windowPreference = () =>
    page.evaluate(
      async () =>
        (await chrome.storage.local.get('preference-storage-key'))[
          'preference-storage-key'
        ].tabManagerWindowClickBehavior,
    )
  await expect.poll(windowPreference).toBe('switch')
  await expect(
    page.getByRole('status').filter({ hasText: 'Setting changed.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect.poll(windowPreference).toBe('view')
  await expect(tip).toHaveCount(0)
})

test('introduces search and keeps all tips available in Options', async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 500 })
  await page.goto('/omnibar/index.html')
  const tour = page.getByRole('dialog')
  await expect(tour).toContainText('Find a page or a command')
  await expect(tour.getByRole('button', { name: 'Next' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(tour.getByRole('button', { name: 'Skip tour' })).toBeFocused()
  await expect(page.locator('[data-omnibar-scope-list]')).toHaveCount(0)
  await tour.getByRole('button', { name: 'Next' }).click()
  await expect(tour).toContainText('press Tab')
  await page.screenshot({ path: '../../test-results/discovery-search.png' })
  await page.keyboard.press('Escape')
  await expect(tour).toHaveCount(0)
  await page.getByRole('combobox').fill('Tabby')
  await page.getByRole('combobox').press('Tab')
  await expect(page.getByLabel('Tabby tip')).toHaveCount(0)
  await expect(page.getByRole('combobox')).toHaveValue('Tabby')

  await page.goto('/options/index.html')
  await page.setViewportSize({ width: 480, height: 640 })
  const library = page.getByRole('region', { name: 'Tips and walkthroughs' })
  await library.getByText('Make switching windows the default').click()
  const change = library.getByRole('button', { name: 'Always switch windows' })
  await expect(change).toBeEnabled()
  await change.click()
  const undo = page.getByRole('button', { name: 'Undo', exact: true })
  await expect(undo).toBeInViewport()
  await expect(undo).toBeFocused()
  await page.screenshot({ path: '../../test-results/discovery-options.png' })
  await page.keyboard.press('Enter')
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await chrome.storage.local.get('preference-storage-key'))[
            'preference-storage-key'
          ].tabManagerWindowClickBehavior,
      ),
    )
    .toBe('view')
})
