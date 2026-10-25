import { expect, test } from '@playwright/test'

test('previews themes in Options and shares their palette with the product', async ({
  page,
}, testInfo) => {
  await page.goto('/?product=options&theme=tabby-brand&mode=light')
  const instance = page.getByRole('region', { name: 'Tabby product demo' })
  const product = instance.locator('[data-surface]')
  const products = page.getByRole('navigation', { name: 'Product experience' })
  const controls = page.getByRole('complementary', { name: 'Demo controls' })
  const mode = product.getByRole('group', { name: 'Theme mode', exact: true })
  const preview = (name: string) =>
    product.getByRole('button', { name, exact: true }).locator('.curated-mini')
  await expect(product.locator('[data-tab-manager-shell]')).toHaveCount(0)
  await expect(
    product.getByRole('heading', { level: 1, name: 'Options', exact: true }),
  ).toBeVisible()
  await expect(product.locator('.theme-palette')).toHaveCount(0)
  await expect(
    product.getByText('Every theme includes a light and dark version.'),
  ).toHaveCount(0)
  const headings = await product
    .locator('h1, h2, h3, h4')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        level: Number(element.tagName.slice(1)),
        size: parseFloat(getComputedStyle(element).fontSize),
      })),
    )
  expect(
    headings.every(({ level, size }) => size === [0, 30, 24, 20, 18][level]),
  ).toBe(true)
  await expect(product.getByRole('heading', { level: 4 })).toHaveText([
    'Tonal',
    'Colorful',
  ])
  await expect(
    product.getByRole('button', { name: 'Seaglass', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    product.getByRole('group', { name: 'Colorful themes' }).getByRole('button'),
  ).toHaveCount(6)
  await expect(
    product.getByRole('group', { name: 'Tonal themes' }).getByRole('button'),
  ).toHaveCount(9)
  await expect(
    product.getByRole('group', { name: 'Seasonal themes' }),
  ).toHaveCount(0)
  await expect(
    product.getByRole('button', { name: 'Rose', exact: true }),
  ).toBeVisible()
  await expect(preview('Seaglass')).toHaveCSS(
    'background-color',
    'rgb(246, 245, 239)',
  )
  await expect(
    page.getByRole('link', {
      name: /Theme lab|Theme collection|Open options page|Options preview/,
    }),
  ).toHaveCount(0)
  await product.screenshot({ path: testInfo.outputPath('tabby-light.png') })
  await page.screenshot({
    path: testInfo.outputPath('studio.png'),
    fullPage: true,
  })
  await product.getByRole('button', { name: 'Arcade', exact: true }).click()
  await mode.getByText('Dark', { exact: true }).click()
  await expect(preview('Arcade').locator('.curated-mini-row').nth(1)).toHaveCSS(
    'background-color',
    'rgb(35, 75, 72)',
  )
  await expect(controls.getByLabel('Theme', { exact: true })).toHaveValue(
    'arcade',
  )
  await expect(page).toHaveURL(/product=options&theme=arcade&mode=dark/)
  await page.reload()
  await expect(
    product.getByRole('button', { name: 'Arcade', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(product.locator('[data-options]')).toBeVisible()
  await instance.screenshot({ path: testInfo.outputPath('options-dark.png') })
  await products
    .getByRole('button', { name: 'Tab manager', exact: true })
    .click()
  await expect(
    product.locator('[data-tab-item][data-selected="true"] > div').first(),
  ).toHaveCSS('background-color', 'rgb(35, 75, 72)')
  await products.getByRole('button', { name: 'Omnibar', exact: true }).click()
  await product.getByRole('combobox').fill('Tabby')
  await expect(product.getByRole('option').first()).toContainText('Tabby')
  await product.getByRole('combobox').fill('')
  await product
    .getByRole('button', { name: 'Open options', exact: true })
    .click()
  await expect(
    products.getByRole('button', { name: 'Options', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    product.getByRole('heading', { name: 'Options', exact: true }),
  ).toBeVisible()
  await product
    .getByRole('button', { name: 'Choose seasonal icons', exact: true })
    .click()
  await expect(
    product.getByRole('group', { name: 'Summer', exact: true }),
  ).toHaveCount(0)
  await expect(
    product.getByRole('heading', { name: 'Seasonal icons', exact: true }),
  ).toBeFocused()
  await product
    .getByRole('button', { name: 'Back to options', exact: true })
    .click()
  await expect(
    product.getByRole('button', { name: 'Choose seasonal icons', exact: true }),
  ).toBeFocused()
  await product.getByRole('button', { name: 'Seaglass', exact: true }).click()
  await mode.getByText('Light', { exact: true }).click()
  await instance.getByRole('button', { name: 'Narrow', exact: true }).click()
  await expect
    .poll(() => product.evaluate((element) => element.clientWidth))
    .toBeLessThanOrEqual(390)
  await instance.screenshot({ path: testInfo.outputPath('options-narrow.png') })
  for (const width of [480, 320]) {
    await page.setViewportSize({ width, height: 800 })
    expect(
      await product
        .locator('[data-options]')
        .evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true)
    expect(
      await product.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await instance.getByRole('button', { name: 'Wide', exact: true }).click()
  await expect(
    product.getByRole('button', { name: 'Reset options', exact: true }),
  ).toHaveCount(0)
  const seasonalIcons = product.getByRole('button', {
    name: 'Choose seasonal icons',
    exact: true,
  })
  await seasonalIcons.scrollIntoViewIfNeeded()
  await instance.screenshot({ path: testInfo.outputPath('options-footer.png') })
})
