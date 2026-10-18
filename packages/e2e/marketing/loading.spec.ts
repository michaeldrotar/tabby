import { expect, test } from '@playwright/test'

test('the homepage paints with its fonts and remains usable if a font fails', async ({
  page,
}) => {
  let releaseFonts!: () => void
  let fontRequests = 0
  const releaseRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('WhatsNew')) releaseRequests.push(request.url())
  })
  const loading = new Promise<void>((resolve) => {
    releaseFonts = resolve
  })
  await page.route('**/fonts/*.ttf', async (route) => {
    fontRequests++
    await loading
    await route.continue()
  })
  await page.goto('./', { waitUntil: 'domcontentloaded' })
  await expect.poll(() => fontRequests).toBe(3)
  await expect(page.locator('#root')).toBeEmpty()
  releaseFonts()
  await expect(page.locator('#hero-title')).toBeVisible()
  expect(releaseRequests).toEqual([])
  expect(
    await page.evaluate(() =>
      ['700 1em Bricolage', '400 1em Manrope', '700 1em Manrope'].every(
        (font) => document.fonts.check(font),
      ),
    ),
  ).toBe(true)
  await page.unroute('**/fonts/*.ttf')
  await page.route('**/fonts/*.ttf', (route) => route.abort())
  await page.reload()
  await expect(page.locator('#hero-title')).toBeVisible()
})

test('release notes download alongside fonts and stay blank until ready', async ({
  page,
}) => {
  let releasePage!: () => void
  let releaseFonts!: () => void
  let fontRequests = 0
  let requested = false
  const fonts = new Promise<void>((resolve) => {
    releaseFonts = resolve
  })
  const loading = new Promise<void>((resolve) => {
    releasePage = resolve
  })
  await page.route('**/*WhatsNew*', async (route) => {
    requested = true
    await loading
    await route.continue()
  })
  await page.route('**/fonts/*.ttf', async (route) => {
    fontRequests++
    await fonts
    await route.continue()
  })
  await page.goto('./whats-new', { waitUntil: 'domcontentloaded' })
  await expect.poll(() => requested).toBe(true)
  await expect.poll(() => fontRequests).toBe(3)
  await expect(page.locator('#root')).toBeEmpty()
  releaseFonts()
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('700 1em Bricolage')))
    .toBe(true)
  await expect(page.locator('#root')).toBeEmpty()
  releasePage()
  await expect(
    page.getByRole('heading', { level: 1, name: 'What’s new in Tabby' }),
  ).toBeVisible()
})
