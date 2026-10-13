import { expect, test } from '@playwright/test'

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
