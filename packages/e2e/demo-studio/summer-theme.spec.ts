import { expect, test } from '@playwright/test'
import { SEASONAL_THEMES_ENABLED } from '../../core/lib/themes'

test('integrates summer details without changing product space or covering controls', async ({
  page,
}, testInfo) => {
  test.skip(!SEASONAL_THEMES_ENABLED, 'Seasonal themes are disabled')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/?curated-themes&theme=summer&mode=dark')
  const picker = page.getByRole('region', {
    name: 'Appearance experiment',
    exact: true,
  })
  const preview = page.getByRole('region', {
    name: 'Live theme preview',
    exact: true,
  })
  const product = page.locator('[data-surface="curated-product"]')
  const details = product.locator('[data-summer-details]')
  const header = product.locator('[data-window-picker-trigger]')
  const geometry = async () => ({
    header: await header.boundingBox(),
    tools: await product
      .getByRole('navigation', { name: 'Tab Manager tools' })
      .boundingBox(),
    shell: await product.locator('[data-tab-manager-shell]').boundingBox(),
  })
  await expect(details).toHaveAttribute('data-appearance', 'dark')
  const summerLayout = await geometry()
  await product
    .getByRole('button', { name: 'Edit window', exact: true })
    .click()
  const done = product.getByRole('button', { name: 'Done', exact: true })
  const reset = product.getByRole('button', { name: 'Reset', exact: true })
  await expect(done).toHaveCSS(
    'color',
    await reset.evaluate((button) => getComputedStyle(button).color),
  )
  await expect(done).toHaveCSS(
    'background-color',
    await reset.evaluate((button) => getComputedStyle(button).backgroundColor),
  )
  await product.screenshot({ path: testInfo.outputPath('editor-night.png') })
  await done.click()
  await expect(done).toBeHidden()
  expect(summerLayout.shell!.height).toBe((await product.boundingBox())!.height)
  await picker.getByRole('button', { name: 'Porcelain', exact: true }).click()
  await expect(details).toHaveCount(0)
  expect(await geometry()).toEqual(summerLayout)
  await picker.getByRole('button', { name: 'Summer', exact: true }).click()
  await expect(details.locator('.summer-constellation')).toBeVisible()
  await expect(details.locator('.summer-meteor')).toHaveCSS(
    'animation-name',
    'summer-meteor',
  )
  expect(await details.getAttribute('aria-hidden')).toBe('true')
  await product.getByRole('button', { name: 'Pause summer animations' }).click()
  await expect(details).toHaveAttribute('data-paused', 'true')
  expect(
    await details.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0)
  await product.screenshot({ path: testInfo.outputPath('manager-night.png') })
  await product.getByRole('button', { name: 'Play summer animations' }).click()
  await expect(details).toHaveAttribute('data-paused', 'false')
  await picker.getByRole('button', { name: 'Light', exact: true }).click()
  await expect(product.locator('.summer-toolbar-ball')).toBeVisible()
  await expect
    .poll(() =>
      product
        .locator('.summer-toolbar-ball')
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true)
  expect(await geometry()).toEqual(summerLayout)
  await expect(details.locator('.summer-atmosphere-portrait')).toHaveAttribute(
    'src',
    /day-sky.jpg$/,
  )
  await expect(details.locator('.summer-atmosphere-wide')).toBeVisible()
  await product
    .getByRole('button', { name: 'Edit window', exact: true })
    .click()
  await expect(done).toHaveCSS(
    'color',
    await reset.evaluate((button) => getComputedStyle(button).color),
  )
  await product.screenshot({ path: testInfo.outputPath('editor-day.png') })
  await done.click()
  await expect(done).toBeHidden()
  await product.screenshot({ path: testInfo.outputPath('manager-day.png') })
  await preview.getByRole('button', { name: 'Narrow', exact: true }).click()
  await expect(details.locator('.summer-atmosphere-portrait')).toBeVisible()
  await expect
    .poll(() =>
      details
        .locator('.summer-atmosphere-portrait')
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true)
  await product.screenshot({
    path: testInfo.outputPath('manager-day-narrow.png'),
  })
  await preview.getByRole('button', { name: 'Narrow', exact: true }).click()
  await preview.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(details).toHaveAttribute('data-summer-details', 'search')
  await expect(product.locator('.summer-treat')).toBeVisible()
  await expect(product.locator('.summer-atmosphere')).toHaveCount(0)
  await expect
    .poll(() =>
      product
        .locator('.summer-treat')
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true)
  await product.screenshot({ path: testInfo.outputPath('search-day.png') })
  await product.getByRole('combobox').fill('Tabby')
  await expect(product.getByRole('option').first()).toContainText('Tabby')
  await expect(details).toHaveCount(0)
  await preview.getByRole('button', { name: 'Appearance', exact: true }).click()
  await expect(details).toHaveAttribute('data-summer-details', 'options')
  await expect(
    product.getByRole('img', { name: 'Tabby', exact: true }),
  ).toHaveCount(1)
  await expect(
    product.getByRole('img', { name: 'Tabby', exact: true }),
  ).toHaveAttribute('src', /summer-sunhat-128.png$/)
  for (const width of [480, 320]) {
    await page.setViewportSize({ width, height: 640 })
    expect(
      await product.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await preview.getByRole('button', { name: 'Tabs', exact: true }).click()
  await expect(details).toHaveAttribute('data-paused', 'true')
  await expect(
    product.getByRole('button', { name: /summer animations/ }),
  ).toHaveCount(0)
  expect(
    await details.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    ),
  ).toBe(0)
  await page
    .getByRole('link', { name: 'Open options page', exact: true })
    .click()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible()
  await page
    .locator('[data-options]')
    .screenshot({ path: testInfo.outputPath('options-day.png') })
  await page
    .getByRole('button', { name: 'Choose seasonal icons', exact: true })
    .click()
  const summerIcons = page.getByRole('group', { name: 'Summer', exact: true })
  await expect(summerIcons.getByRole('radio')).toHaveCount(4)
  await summerIcons
    .locator('label')
    .filter({ has: page.getByRole('radio', { name: 'Snorkel', exact: true }) })
    .click()
  await expect(
    summerIcons.getByRole('radio', { name: 'Snorkel', exact: true }),
  ).toBeChecked()
  await summerIcons.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      summerIcons
        .locator('img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true)
  await summerIcons.screenshot({
    path: testInfo.outputPath('summer-icons.png'),
  })
  await page
    .getByRole('button', { name: 'Back to settings', exact: true })
    .click()
  await expect(
    page.getByRole('img', { name: 'Tabby', exact: true }),
  ).toHaveAttribute('src', /summer-snorkel-128.png$/)
  await page.getByText('Show seasonal icons', { exact: true }).click()
  await expect(
    page.getByRole('img', { name: 'Tabby', exact: true }),
  ).not.toHaveAttribute('src', /summer-snorkel-128.png$/)
  await expect(page.locator('[data-summer-details="options"]')).toBeVisible()
})
