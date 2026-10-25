import { expect, test } from '@playwright/test'
import releases from '../../../pages/marketing/src/releases.json' with { type: 'json' }

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true })

test('mobile release notes read with the page and support links, swipe, and history', async ({
  page,
}, testInfo) => {
  await page.goto('./whats-new#v1.6.0')
  await expect(page.locator('[id="v1.6.0"]')).toBeInViewport()
  const reader = page.getByRole('region', { name: 'Release notes' })
  const chooser = page.getByRole('button', { name: 'Choose a version' })
  const pagination = page.getByRole('navigation', { name: 'Adjacent releases' })
  const newer = pagination.getByRole('link', { name: /^Newer release/ })
  const older = pagination.getByRole('link', { name: /^Older release/ })
  const selected = async (version: string) => {
    await expect(chooser).toContainText(version)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(page.getByRole('article')).toHaveAttribute('id', version)
    await expect(reader).toHaveCSS('transform', 'none')
    await expect(reader).toHaveCSS('opacity', '1')
  }
  const pageDown = async () => {
    const settled = page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          window.addEventListener('scrollend', () => resolve(), { once: true })
        }),
    )
    await page.keyboard.press('PageDown')
    await settled
  }
  await selected('v1.6.0')
  await expect(newer).toHaveText('v1.7.0')
  await expect(older).toHaveText('v1.5.0')
  await expect(chooser).toHaveCount(1)
  await expect(page.locator('.release-index')).toHaveCount(0)
  await expect(page.getByText('Latest release', { exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 320, height: 812 })
  const metadata = chooser
  expect((await metadata.boundingBox())!.height).toBeLessThan(50)
  expect(
    await metadata.evaluate(
      (element) => element.scrollWidth - element.clientWidth,
    ),
  ).toBeLessThanOrEqual(1)
  await page.screenshot({
    path: testInfo.outputPath('release-selectors-narrow.png'),
  })
  await page.setViewportSize({ width: 375, height: 812 })
  await page.screenshot({
    path: testInfo.outputPath('single-release-mobile.png'),
  })
  const initialScroll = await page.evaluate(() => scrollY)
  const article = page.getByRole('article')
  await reader.focus()
  await pageDown()
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(initialScroll)
  expect(await article.evaluate((element) => element.scrollTop)).toBe(0)
  expect(await reader.evaluate((element) => element.scrollTop)).toBe(0)
  expect(
    await article.evaluate(
      (element) => element.scrollHeight - element.clientHeight,
    ),
  ).toBeLessThanOrEqual(1)
  await expect(chooser).toBeInViewport()
  await older.scrollIntoViewIfNeeded()
  await page.screenshot({
    path: testInfo.outputPath('single-release-pagination.png'),
  })
  await older.hover()
  await expect
    .poll(() =>
      older
        .locator('svg')
        .evaluate(
          (element) => new DOMMatrix(getComputedStyle(element).transform).m41,
        ),
    )
    .toBeGreaterThan(0)
  await older.click()
  await selected('v1.5.0')
  await expect(page).toHaveURL(/#v1\.5\.0$/)
  await expect(
    page.getByRole('heading', { level: 2, name: 'Seasonal icons' }),
  ).toBeInViewport()
  expect((await reader.boundingBox())!.y).toBeCloseTo(80, 0)
  await expect(reader).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await selected('v1.4.0')
  await page.keyboard.press('ArrowLeft')
  await selected('v1.5.0')

  const session = await page.context().newCDPSession(page)
  const frame = (await reader.boundingBox())!
  await session.send('Input.synthesizeScrollGesture', {
    x: frame.x + frame.width - 25,
    y: frame.y + 100,
    xDistance: -240,
    yDistance: 0,
    speed: 700,
    gestureSourceType: 'touch',
  })
  await selected('v1.4.0')
  await expect(page).toHaveURL(/#v1\.4\.0$/)
  await session.send('Input.synthesizeScrollGesture', {
    x: frame.x + 25,
    y: frame.y + 100,
    xDistance: 240,
    yDistance: 0,
    speed: 700,
    gestureSourceType: 'touch',
  })
  await selected('v1.5.0')
  await session.detach()

  await reader.hover({ position: { x: 120, y: 160 } })
  await page.mouse.wheel(90, 0)
  await page.mouse.wheel(180, 0)
  await selected('v1.4.0')
  await page.mouse.wheel(-90, 0)
  await selected('v1.5.0')

  await chooser.click()
  await page.keyboard.press('Escape')
  await expect(chooser).toBeFocused()
  await chooser.click()
  await page.getByRole('link', { name: 'v1.0.0 The Launch' }).click()
  await selected('v1.0.0')
  await expect(older).toHaveCount(0)
  await expect(newer).toContainText('v1.1.0')
  await expect(chooser).toHaveAttribute('aria-expanded', 'false')
  await expect(chooser).toBeFocused()
  await chooser.click()
  await expect(
    page.getByRole('link', { name: 'v1.0.0 The Launch' }),
  ).toHaveAttribute('aria-current', 'true')
  await page.keyboard.press('Escape')
  await page.locator('.skip-link').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#v1\.0\.0$/)
  await expect(article).toBeFocused()
  await page.keyboard.press('PageDown')
  // Change versions while Chromium's native keyboard scroll is still moving.
  await page.waitForTimeout(80)
  await page.keyboard.press('ArrowLeft')
  await selected('v1.1.0')
  await expect
    .poll(async () => (await reader.boundingBox())!.y)
    .toBeCloseTo(80, 0)
  await page.goBack()
  await selected('v1.0.0')
  await page.reload()
  await selected('v1.0.0')
  await expect(chooser).toBeInViewport()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await reader.focus()
  await page.keyboard.press('ArrowLeft')
  await selected('v1.1.0')
  expect(
    await reader.evaluate((element) => element.getAnimations().length),
  ).toBe(0)
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(page.getByRole('article')).toHaveCount(releases.length)
  await expect(pagination).toHaveCount(0)
  await expect(page.locator('[id="v1.1.0"]')).toBeInViewport()
})

test('reduced motion aligns a new release during native keyboard scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./whats-new#v1.0.0')
  const reader = page.getByRole('region', { name: 'Release notes' })
  await reader.focus()
  await page.keyboard.press('PageDown')
  await page.keyboard.press('ArrowLeft')
  await expect(
    page.getByRole('button', { name: 'Choose a version' }),
  ).toContainText('v1.1.0')
  // Include the end of the native scroll, rather than an intermediate position.
  await page.waitForTimeout(350)
  expect((await reader.boundingBox())!.y).toBeCloseTo(80, 0)
  await expect(page.getByRole('article')).toBeInViewport()
  expect(
    await reader.evaluate((element) => element.getAnimations().length),
  ).toBe(0)
})

test('trackpad gestures can repeat and reverse through momentum without moving the pointer', async ({
  page,
}) => {
  await page.goto('./whats-new#v1.6.0')
  const chooser = page.getByRole('button', { name: 'Choose a version' })
  await expect(chooser).toContainText('v1.6.0')
  await page.mouse.move(180, 320)
  const scroll = async (deltas: number[]) => {
    for (const delta of deltas) {
      await page.mouse.wheel(delta, 0)
      // Momentum and the next gesture overlap, without the idle reset gap.
      await page.waitForTimeout(50)
    }
  }
  await scroll([90, 40, 20, 10, 5, 2])
  await expect(chooser).toContainText('v1.5.0')
  await scroll([12, 36, 60, 40, 20, 10, 5, 2])
  await expect(chooser).toContainText('v1.4.0')
  await scroll([-12, -36, -60, -40, -20, -10, -5, -2])
  await expect(chooser).toContainText('v1.5.0')
  const before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(2, 160)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
  await expect(chooser).toContainText('v1.5.0')
})

test('desktop navigation marks the visible fraction of each release', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('./whats-new')
  await expect(page.getByRole('article')).toHaveCount(releases.length)
  const { top, height } = await page.evaluate(() => {
    const bounds = ['v1.5.0', 'v1.4.0', 'v1.3.0'].map((version) =>
      document.getElementById(version)!.getBoundingClientRect(),
    )
    const first = bounds[1]!.top - bounds[0]!.top
    const second = bounds[2]!.top - bounds[1]!.top
    return {
      top: scrollY + bounds[0]!.top + first * 0.5,
      height: Math.round(first * 0.5 + second * 0.1),
    }
  })
  await page.setViewportSize({ width: 1280, height })
  await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), top)
  const versions = page.getByRole('navigation', { name: 'Release versions' })
  const segment = async (version: string) =>
    versions
      .getByRole('link', { name: new RegExp(`^${version} `) })
      .evaluate((element) => {
        const indicator = getComputedStyle(element, '::before')
        const height = element.getBoundingClientRect().height
        return {
          start: parseFloat(indicator.top) / height,
          size: parseFloat(indicator.height) / height,
        }
      })
  await expect
    .poll(async () => (await segment('v1.5.0')).start)
    .toBeCloseTo(0.5, 2)
  expect((await segment('v1.5.0')).size).toBeCloseTo(0.5, 2)
  expect((await segment('v1.4.0')).start).toBe(0)
  expect((await segment('v1.4.0')).size).toBeCloseTo(0.1, 2)
  expect((await segment('v1.6.0')).size).toBe(0)
  expect((await segment('v1.3.0')).size).toBe(0)
  const hovered = versions.getByRole('link', { name: 'v1.5.0 Seasonal icons' })
  const border = await hovered.evaluate(
    (element) => getComputedStyle(element).borderLeftColor,
  )
  await hovered.hover()
  await expect(hovered).toHaveCSS('border-left-color', border)
  expect((await segment('v1.5.0')).size).toBeCloseTo(0.5, 2)
  await page.screenshot({
    path: testInfo.outputPath('desktop-hover-visible-release.png'),
  })
  await versions.getByRole('link', { name: /^v1.6.0 / }).hover()
  await page.screenshot({
    path: testInfo.outputPath('desktop-hover-other-release.png'),
  })
  await page.setViewportSize({ width: 1280, height: height + 120 })
  await expect
    .poll(async () => (await segment('v1.4.0')).size)
    .toBeGreaterThan(0.1)
})
