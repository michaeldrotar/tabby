import { expect, test } from '@playwright/test'

test('a visitor explores Tabby, searches, customizes, plays the showcase, and resets at mobile width', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5183/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Less tab hunting.',
  )
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(
    page.getByRole('link', { name: /Add Tabby to Chrome/ }).first(),
  ).toHaveAttribute(
    'href',
    'https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob',
  )
  const demo = page.getByLabel('Interactive Tabby demo')
  await expect(
    demo.getByRole('option', { name: 'Tab: Design brief', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Find anything/ }).click()
  await demo.getByRole('textbox').fill('design')
  await expect(demo).toContainText('Design system handbook')
  await expect(demo).toContainText('Designing a calmer workspace')
  await expect(demo).toContainText('Design checklist')
  await demo.getByRole('textbox').fill('')
  await demo.getByText('Open Options', { exact: true }).click()
  await expect(demo).toContainText('Appearance')
  await page.getByRole('button', { name: 'Watch the showcase' }).click()
  await page.getByRole('button', { name: 'Pause showcase' }).click()
  await page.getByLabel('Showcase progress').fill('6000')
  await expect(demo).not.toContainText('Coffee grinder comparison')
  await expect(demo).toContainText('Design brief')
  await page.getByLabel('Showcase progress').fill('11000')
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page.getByRole('button', { name: 'Reset demo' }).click()
  await expect(demo).toContainText('Coffee grinder comparison')
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-input-mode',
    'live',
  )
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  const marketingImages = page.locator(
    'img[src^="/media/"], .brand img, .closing > img',
  )
  await expect(marketingImages).toHaveCount(5)
  for (const image of await marketingImages.all()) {
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth),
      )
      .toBeGreaterThan(0)
  }
  await page
    .locator('video')
    .evaluate((video: HTMLVideoElement) => video.load())
  await expect
    .poll(() =>
      page
        .locator('video')
        .evaluate((video: HTMLVideoElement) => video.readyState),
    )
    .toBeGreaterThan(0)
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(375)
  await page.getByRole('button', { name: /Do more at once/ }).click()
  await expect(
    demo.getByRole('option', {
      name: 'Tab: Coffee grinder comparison',
      exact: true,
    }),
  ).toHaveAttribute('aria-selected', 'true')
  expect(errors).toEqual([])
})
