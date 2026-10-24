import { expect, test } from '@playwright/test'

test('tries coordinated themes across tabs, search, and appearance', async ({
  page,
}, testInfo) => {
  await page.goto('/')
  await page
    .getByRole('link', { name: 'Theme collection', exact: true })
    .click()
  const picker = page.getByRole('region', {
    name: 'Appearance experiment',
    exact: true,
  })
  const preview = page.getByRole('region', {
    name: 'Live theme preview',
    exact: true,
  })
  const product = preview.locator('[data-surface="curated-product"]')
  await expect(
    picker.getByRole('button', { name: 'Porcelain', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await picker.getByRole('button', { name: 'Arcade', exact: true }).click()
  await expect(
    preview.getByRole('heading', { name: 'Arcade', exact: true }),
  ).toBeVisible()
  await expect(
    picker.getByRole('button', { name: 'Summer', exact: true }),
  ).toHaveCount(0)
  await expect(
    picker.getByRole('button', { name: 'Tabby', exact: true }),
  ).toHaveCount(0)
  await expect(
    product.locator('[data-tab-item][data-selected="true"]'),
  ).toHaveCount(1)
  await expect(
    product.locator('[data-tab-item][data-selected="true"] > div').first(),
  ).toHaveCSS('background-color', 'rgb(35, 75, 72)')
  await preview.getByRole('button', { name: 'Narrow', exact: true }).click()
  expect(
    await product.evaluate((element) => element.clientWidth),
  ).toBeLessThanOrEqual(320)
  await product
    .getByRole('button', { name: 'More actions', exact: true })
    .click()
  await expect(product.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Escape')
  await preview.getByRole('button', { name: 'Search', exact: true }).click()
  await product.getByRole('combobox').fill('Tabby')
  await expect(product.getByRole('option').first()).toContainText('Tabby')
  await preview.getByRole('button', { name: 'Appearance', exact: true }).click()
  await product.getByRole('button', { name: 'Reef', exact: true }).click()
  await expect(
    picker.getByRole('button', { name: 'Reef', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await product
    .getByRole('group', { name: 'Theme mode', exact: true })
    .getByText('Light', { exact: true })
    .click()
  await expect(product).toHaveAttribute('data-theme', 'light')
  await expect(
    picker.getByRole('button', { name: 'Light', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/theme=reef&mode=light/)
  await page.reload()
  await expect(
    preview.getByRole('heading', { name: 'Reef', exact: true }),
  ).toBeVisible()
  await expect(product).toHaveAttribute('data-theme', 'light')
  await picker.getByRole('button', { name: 'Matcha', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('matcha-light.png'),
    fullPage: true,
  })
  await picker.getByRole('button', { name: 'Arcade', exact: true }).click()
  await picker.getByRole('button', { name: 'Dark', exact: true }).click()
  await page.screenshot({
    path: testInfo.outputPath('arcade-dark.png'),
    fullPage: true,
  })
  for (const width of [480, 320]) {
    await page.setViewportSize({ width, height: 640 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    expect(
      await product.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    await preview
      .getByRole('button', { name: 'Appearance', exact: true })
      .click()
    expect(
      await product.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    await product.getByRole('button', { name: 'Tidal', exact: true }).click()
    await expect(
      preview.getByRole('heading', { name: 'Tidal', exact: true }),
    ).toBeVisible()
    await preview.getByRole('button', { name: 'Tabs', exact: true }).click()
  }
  await page
    .getByRole('link', { name: 'Open options page', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Reset', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Arcade', exact: true }).click()
  await page
    .getByRole('group', { name: 'Theme mode', exact: true })
    .getByText('System', { exact: true })
    .click()
  await expect(page).toHaveURL(/page=options.*theme=arcade&mode=system/)
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Arcade', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('radio', { name: 'System', exact: true }),
  ).toBeChecked()
  await page
    .getByRole('group', { name: 'Theme mode', exact: true })
    .getByText('Dark', { exact: true })
    .click()
  await page.setViewportSize({ width: 728, height: 1000 })
  await page.screenshot({
    path: testInfo.outputPath('options-page.png'),
    fullPage: true,
  })
  await page
    .getByRole('button', { name: 'Reset preferences', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Porcelain', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})
