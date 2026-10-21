import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const enterComparisonMode = async (page: Page) => {
  await expect(
    page.getByRole('region', { name: 'Tabby product demo' }),
  ).toBeVisible()
  await expect(page.getByRole('region', { name: 'Instance A' })).toHaveCount(0)
  await page.getByLabel('Compare a second instance').check()
  return {
    left: page.getByRole('region', { name: 'Instance A' }),
    right: page.getByRole('region', { name: 'Instance B' }),
  }
}

test('search recalls a chosen tab above other matches when the query is repeated', async ({
  page,
}) => {
  await page.goto('/')
  const instance = page.getByRole('region', { name: 'Tabby product demo' })
  const products = page.getByRole('navigation', { name: 'Product experience' })
  const openSearch = () =>
    products.getByRole('button', { name: 'Omnibar', exact: true }).click()
  await openSearch()
  await instance.getByRole('combobox').fill('e')
  await expect(
    instance.getByRole('option', { name: /^Reference 4 tab/ }),
  ).toBeVisible()
  await expect(
    instance.getByRole('option', { name: /^Closed research guide/ }),
  ).toBeVisible()
  await expect(
    instance.getByRole('option', { name: /^Tabby architecture guide/ }),
  ).toBeVisible()
  await instance.getByRole('combobox').fill('ref')
  await expect(instance.getByRole('option').nth(1)).toContainText('Reference')
  await instance.getByRole('option', { name: /^Reference 4 tab/ }).click()
  await expect(instance.locator('[data-window-picker-trigger]')).toBeVisible()
  await openSearch()
  await instance.getByRole('combobox').fill('ref')
  await expect(instance.getByRole('option').nth(1)).toContainText('Reference 4')
  await expect(instance.getByRole('option').first()).toContainText(
    'Search Google',
  )
  await instance.getByRole('combobox').press('ArrowDown')
  await instance.getByRole('combobox').press('Enter')
  await expect(instance.locator('[data-window-picker-trigger]')).toBeVisible()
})

test('a large browser stays responsive through selection and window switching at sidebar width', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 800 })
  await page.goto('/')
  const { left, right } = await enterComparisonMode(page)
  const sampleData = page.getByLabel('Sample data', { exact: true })

  await sampleData.selectOption('single-window')
  await expect(left).toContainText('1 windows · 4 tabs')
  await sampleData.selectOption('many-windows')
  await expect(left).toContainText('6 windows · 42 tabs')
  await sampleData.selectOption('large')
  await expect(left).toContainText('400 tabs')

  await left
    .getByRole('option', { name: 'Tab: Tabby (pinned)', exact: true })
    .click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
  await expect(left).toContainText('200 tabs')
  await expect(right).toContainText('200 tabs')
  await expect(left.locator('[data-manager-scroll]')).toHaveCount(1)
  await expect(
    left.getByRole('option', { name: 'Tab: Release checklist', exact: true }),
  ).toBeVisible()
  await left.locator('[data-window-picker-trigger]').click()
  await left.locator('[data-window-choice="2"]').click()
  await expect(left.locator('[data-window-picker-trigger]')).toContainText(
    'Reading list',
  )
  await expect(left.locator('[data-window-picker]')).toHaveCount(0)
  await expect(right.locator('[data-manager-scroll]')).toHaveCount(1)
})

test('browser data, view state, and preferences can be shared independently', async ({
  page,
}) => {
  await page.goto('/')
  const { left, right } = await enterComparisonMode(page)
  const shareData = page.getByLabel('Share browser data', { exact: true })
  const shareViewState = page.getByLabel('Share view state', { exact: true })

  await expect(shareViewState).toBeDisabled()
  await expect(shareViewState).not.toBeChecked()
  await shareData.check()
  await expect(shareViewState).toBeEnabled()
  await shareViewState.check()

  await left.locator('[data-tab-id="11"]').click()
  await page.keyboard.press('Delete')
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(0)
  await expect(right.locator('[data-tab-id="11"]')).toHaveCount(0)
  const chooseLeftWindow = async (id: number) => {
    await left.locator('[data-window-picker-trigger]').click()
    await left.locator(`[data-window-choice="${id}"]`).click()
  }
  await chooseLeftWindow(2)
  await expect(left.locator('[data-window-picker-trigger]')).toContainText(
    'Reading list',
  )
  await expect(right.locator('[data-window-picker-trigger]')).toContainText(
    'Reading list',
  )

  await shareViewState.uncheck()
  await chooseLeftWindow(2)
  await expect(left.locator('[data-window-picker-trigger]')).toContainText(
    'Reading list',
  )
  await expect(right.locator('[data-window-picker-trigger]')).toContainText(
    'Workspace',
  )
  await shareData.uncheck()
  await expect(shareViewState).toBeDisabled()
  await expect(shareViewState).not.toBeChecked()

  await page.getByLabel('Ignore data commands').check()
  await chooseLeftWindow(1)
  await left.locator('[data-tab-id="11"]').click()
  await page.keyboard.press('Delete')
  await expect(left).toContainText('ignored; data unchanged')
  await expect(left.locator('[data-tab-id="11"]')).toHaveCount(1)
  await page.getByLabel('Ignore data commands').uncheck()

  await page.getByLabel('Share preferences').check()
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await page
    .getByRole('group', { name: 'Instance appearance' })
    .getByRole('button', { name: 'Dark' })
    .click()
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page
    .getByRole('group', { name: 'Background color' })
    .getByRole('button', { name: 'Choose slate background color' })
    .click()
  await expect(left.locator('[data-surface]')).toHaveAttribute(
    'data-theme-background',
    'slate',
  )
  await expect(right.locator('[data-surface]')).toHaveAttribute(
    'data-theme-background',
    'slate',
  )
})

test('guided playback, anatomy, and product selection stay in sync', async ({
  page,
}) => {
  await page.goto('/')
  const instance = page.getByRole('region', { name: 'Tabby product demo' })
  const experience = page.getByRole('group', { name: 'Demo experience' })
  const products = page.getByRole('navigation', { name: 'Product experience' })

  await experience.getByRole('button', { name: /Guided/ }).click()
  await expect(
    page.getByRole('heading', { name: 'See a workflow unfold.' }),
  ).toBeVisible()
  const chapters = page.getByRole('group', { name: 'Demo chapters' })
  await chapters.getByRole('button', { name: /Omnibar/ }).click()
  await expect(
    instance.locator('.product-frame[data-product="omnibar"]'),
  ).toBeVisible()
  const tour = page.getByRole('group', { name: 'Product tour playback' })
  await tour
    .getByRole('button', { name: /Find tabs, bookmarks, and history/ })
    .click()
  await expect(instance.getByRole('combobox')).toHaveValue('Tabby')
  await chapters.getByRole('button', { name: /Options/ }).click()
  await expect(instance.locator('[data-options]')).toBeVisible()
  await tour.getByRole('button', { name: 'Rewind' }).click()
  await expect(
    instance.locator('.product-frame[data-product="manager"]'),
  ).toBeVisible()

  await experience.getByRole('button', { name: /Anatomy/ }).click()
  const managerParts = page.getByRole('group', {
    name: 'Tab manager components',
  })
  const tabRows = managerParts.getByRole('button', { name: /Tab rows/ })
  await tabRows.click()
  await expect(tabRows).toHaveAttribute('aria-pressed', 'true')

  await products.getByRole('button', { name: 'Options' }).click()
  await expect(instance.locator('[data-options]')).toBeVisible()
  await expect(
    page.getByRole('group', { name: 'Options components' }),
  ).toBeVisible()
  await experience.getByRole('button', { name: /Still/ }).click()
  await expect(
    products.getByRole('button', { name: 'Tab manager' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    instance.locator('.product-frame[data-product="manager"]'),
  ).toBeVisible()
  await expect(
    page.getByRole('status').filter({ hasText: 'Still frame' }),
  ).toBeVisible()
})
