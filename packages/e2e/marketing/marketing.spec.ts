import { expect, test } from '@playwright/test'

test('homepage separates the live demo and switches to a video without losing demo changes', async ({
  page,
}) => {
  await page.goto('./')
  await expect(page.locator('.site')).toHaveClass(/site--home/)
  const showcase = page.locator('.hero-showcase')
  const demo = showcase.locator('[data-demo]')
  await expect(
    showcase.getByRole('heading', { name: 'Try it', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.hero .tab-sticker')).toHaveCount(0)
  await demo.getByRole('button', { name: 'Dark mode', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Play tour', exact: true }),
  ).toHaveCount(0)
  await demo.getByRole('button', { name: 'Search', exact: true }).click()
  await demo.getByRole('combobox').fill('Copenhagen')
  const switchToVideo = showcase.getByRole('button', {
    name: 'Or watch our video',
    exact: true,
  })
  const [rotationFrames] = await Promise.all([
    showcase.locator('#hero-showcase-content').evaluate(async (element) => {
      const frames: string[] = []
      const start = performance.now()
      await new Promise<void>((resolve) => {
        const sample = () => {
          frames.push(getComputedStyle(element).transform)
          if (performance.now() - start < 1000) requestAnimationFrame(sample)
          else resolve()
        }
        requestAnimationFrame(sample)
      })
      return [...new Set(frames)]
    }),
    switchToVideo.click(),
  ])
  expect(rotationFrames.length).toBeGreaterThan(2)
  await expect(
    showcase.getByRole('button', { name: 'Or try our demo', exact: true }),
  ).toBeFocused()
  await expect(
    showcase.getByRole('heading', { name: 'Watch it', exact: true }),
  ).toBeVisible()
  await expect(demo).toBeHidden()
  const video = showcase.locator('video')
  await expect(video).toBeVisible()
  await expect(video).toHaveJSProperty('muted', true)
  await expect(video).toHaveJSProperty('controls', true)
  await expect(video.locator('track')).toHaveAttribute('kind', 'captions')
  await video.evaluate(async (element: HTMLVideoElement) => {
    await element.play()
  })
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.currentTime),
    )
    .toBeGreaterThan(0)
  await expect
    .poll(() =>
      video.evaluate((element) => {
        const media = element as HTMLVideoElement & {
          captureStream(): MediaStream
        }
        return media.captureStream().getAudioTracks().length
      }),
    )
    .toBe(1)
  await video.evaluate((element: HTMLVideoElement) => {
    element.muted = false
  })
  await expect(video).toHaveJSProperty('muted', false)
  await showcase
    .getByRole('button', { name: 'Or try our demo', exact: true })
    .click()
  await expect(video).toBeHidden()
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true)
  await expect(demo.getByRole('combobox')).toHaveValue('Copenhagen')
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await showcase.scrollIntoViewIfNeeded()
  await expect(
    demo.getByRole('button', { name: 'Tabs', exact: true }),
  ).toBeVisible()
  const app = demo.locator('.demo-screen')
  await expect
    .poll(() =>
      app.evaluate((element) => {
        const { left, right } = element.getBoundingClientRect()
        return left >= 0 && right <= innerWidth
      }),
    )
    .toBe(true)
  await showcase
    .getByRole('button', { name: 'Or watch our video', exact: true })
    .click()
  await expect(
    showcase.getByRole('heading', { name: 'Watch it', exact: true }),
  ).toBeVisible()
  await expect(showcase.locator('video')).toBeVisible()
  await expect(video).toHaveJSProperty('muted', false)
})

test('sample tabs support batch work, local search, appearance, playback, and reset', async ({
  page,
}) => {
  await page.goto('./?design=companion')
  const demo = page.locator('#try [data-demo]')
  const hero = page.locator('.hero [data-demo]')
  await demo.scrollIntoViewIfNeeded()
  await demo
    .getByRole('option', { name: 'Tab: Team inbox', exact: true })
    .click()
  await demo
    .getByRole('option', { name: 'Tab: Launch checklist', exact: true })
    .click({ modifiers: ['ControlOrMeta'] })
  await expect(
    demo.getByRole('status', { name: '0 windows, 0 tab groups, 2 tabs' }),
  ).toBeVisible()
  await demo.getByRole('button', { name: 'More actions', exact: true }).click()
  await demo.getByRole('menuitem', { name: 'Pin 2 tabs', exact: true }).click()
  await expect(
    demo.getByRole('option', { name: 'Tab: Team inbox (pinned)', exact: true }),
  ).toBeVisible()
  await expect(
    hero.getByRole('option', { name: 'Tab: Team inbox', exact: true }),
  ).toBeVisible()
  await demo.getByRole('button', { name: 'Search', exact: true }).click()
  const input = demo.getByRole('combobox')
  await input.fill('design')
  await expect(
    demo.getByText('Design references', { exact: true }),
  ).toBeVisible()
  await expect(
    demo.getByText('Design review notes', { exact: true }),
  ).toBeVisible()
  await input.fill('nothing matches this sample')
  await expect(
    demo.getByText('Design references', { exact: true }),
  ).toHaveCount(0)
  await demo.getByRole('button', { name: 'Dark mode', exact: true }).click()
  await demo.getByRole('button', { name: 'violet accent', exact: true }).click()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'violet',
  )
  await expect(hero.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await demo.getByRole('button', { name: 'Play tour' }).click()
  await expect(
    demo.getByText('All your windows, in one place', { exact: true }),
  ).toBeVisible()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await expect(
    demo.getByRole('option', { name: 'Tab: Team inbox', exact: true }),
  ).toBeVisible()
  await demo.getByRole('button', { name: 'Pause tour' }).click()
  await demo.getByLabel('Tour progress').fill('5200')
  await expect(demo.getByText('Launch', { exact: true })).toBeVisible()
  await demo.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(
    demo.getByRole('option', { name: 'Tab: Team inbox', exact: true }),
  ).toBeVisible()
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await expect(demo.getByLabel('Tour progress')).toHaveCount(0)
  await demo
    .getByRole('group', { name: 'Demo experience' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
  await demo
    .getByRole('button', { name: 'Open appearance settings', exact: true })
    .click()
  await expect(
    demo.getByText(
      'Choose your side panel position in Chrome after installing Tabby.',
      { exact: true },
    ),
  ).toBeVisible()
  const video = page.locator('video')
  await video.scrollIntoViewIfNeeded()
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = true
    await element.play()
  })
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.readyState),
    )
    .toBeGreaterThanOrEqual(2)
  await expect(page.locator('.site-header .install')).toHaveAttribute(
    'href',
    'https://chromewebstore.google.com/detail/tabby/jjkakicjobpalhifpeaggabpgdllmmob',
  )
})

test('three designs keep their content and controls usable on narrow screens', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  for (const design of ['companion', 'focus', 'playground']) {
    await page.goto(design)
    await expect(page.locator('.site')).toHaveClass(
      new RegExp(`site--${design}`),
    )
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.locator('.site-header .install')).toBeVisible()
    const previews = page.getByRole('navigation', { name: 'Design previews' })
    await expect(
      previews.getByRole('link', { name: 'Focus', exact: true }),
    ).toHaveAttribute('href', new URL('focus', baseURL).pathname)
    const demo = page.locator('#try [data-demo]')
    await demo.scrollIntoViewIfNeeded()
    await expect(demo.getByRole('button', { name: 'Play tour' })).toBeVisible()
    await demo.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(demo.getByRole('combobox')).toBeVisible()
    await page.locator('.closing').scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true)
    await expect
      .poll(() =>
        page
          .locator('img')
          .evaluateAll((images: HTMLImageElement[]) =>
            images.every((image) => !image.complete || image.naturalWidth > 0),
          ),
      )
      .toBe(true)
  }
})
