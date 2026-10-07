import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

const expectMenuLeadingEdgeClickable = async (page: Page) => {
  await page.getByRole('button', { name: 'More actions' }).click()
  const menu = page.locator('[data-action-bar-menu]')
  await expect(menu).toBeVisible()
  const leadingEdgeIsClickable = await menu
    .locator('button:enabled')
    .first()
    .evaluate((button) => {
      const bounds = button.getBoundingClientRect()
      return button.contains(
        document.elementFromPoint(
          bounds.left + 12,
          bounds.top + bounds.height / 2,
        ),
      )
    })
  expect(leadingEdgeIsClickable).toBe(true)
}

const sampleSidebarTransition = (page: Page) =>
  page.evaluate(async () => {
    const surface = document.querySelector<HTMLElement>(
      '[data-sidebar-surface]',
    )
    const main = document.querySelector('main')
    const windowButton = surface?.querySelector('[data-nav-type="window"]')
    const toggle = surface?.querySelector('button')
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const context = canvas.getContext('2d')
    if (!surface || !main || !windowButton || !toggle || !context) {
      throw new Error('The sidebar and tab pane must be ready.')
    }

    const sample = () => {
      const bounds = surface.getBoundingClientRect()
      const paneBounds = main.getBoundingClientRect()
      const background = getComputedStyle(surface).backgroundColor
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = background
      context.fillRect(0, 0, 1, 1)
      return {
        width: bounds.width,
        background,
        alpha: context.getImageData(0, 0, 1, 1).data[3],
        paneLeft: paneBounds.left,
        paneWidth: paneBounds.width,
        coversTabs: surface.contains(
          document.elementFromPoint(
            bounds.right - 2,
            windowButton.getBoundingClientRect().top + 10,
          ),
        ),
        coversActionBar: surface.contains(
          document.elementFromPoint(bounds.right - 2, bounds.bottom - 20),
        ),
      }
    }

    const before = sample()
    toggle.click()
    const samples = []
    const start = performance.now()
    while (performance.now() - start < 450) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      samples.push(sample())
    }
    return { before, samples }
  })

for (const { colorScheme, width } of [
  { colorScheme: 'light', width: 390 },
  { colorScheme: 'dark', width: 320 },
] as const) {
  test(`sidebar stays opaque above tabs throughout ${colorScheme} transitions`, async ({
    page,
    extensionId,
  }) => {
    await page.setViewportSize({ width, height: 700 })
    await page.emulateMedia({ colorScheme, reducedMotion: 'no-preference' })
    await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
    await expect(page.locator('[data-nav-type="window"]')).toBeVisible()
    await page.evaluate(async () => {
      const currentWindow = await chrome.windows.getCurrent()
      for (const title of ['Product brief', 'Design review']) {
        await chrome.tabs.create({
          windowId: currentWindow.id,
          active: false,
          url: `data:text/html,<title>${title}</title>`,
        })
      }
    })
    await expect(
      page.getByRole('option', { name: 'Tab: Product brief' }),
    ).toBeVisible()
    await expect(page.locator('body')).toHaveAttribute(
      'data-theme',
      colorScheme,
    )
    await page.getByRole('button', { name: 'Expand sidebar' }).click()
    const surface = page.locator('[data-sidebar-surface]')
    await expect
      .poll(async () => (await surface.boundingBox())?.width)
      .toBe(256)

    for (let transition = 0; transition < 2; transition++) {
      const { before, samples } = await sampleSidebarTransition(page)
      expect(samples.some(({ width }) => width > 65 && width < 255)).toBe(true)
      for (const frame of samples) {
        expect(frame.background).toBe(before.background)
        expect(frame.alpha).toBe(255)
        expect(frame.paneLeft).toBe(before.paneLeft)
        expect(frame.paneWidth).toBe(before.paneWidth)
        expect(frame.coversTabs).toBe(true)
        expect(frame.coversActionBar).toBe(true)
      }
      expect(samples.at(-1)?.width).toBe(transition === 0 ? 64 : 256)

      if (transition === 0) {
        await expectMenuLeadingEdgeClickable(page)
        await page.keyboard.press('Escape')
      }
    }

    await page.emulateMedia({ reducedMotion: 'reduce' })
    const { samples } = await sampleSidebarTransition(page)
    expect(samples.every(({ width }) => width === 64 || width === 256)).toBe(
      true,
    )
    expect(samples.at(-1)?.width).toBe(64)
  })
}

test('action menu stays clickable after reversing sidebar expansion', async ({
  page,
  extensionId,
}) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  const toggle = page.getByRole('button', { name: 'Expand sidebar' })
  await expect(toggle).toBeVisible()
  await toggle.evaluate(async (button) => {
    const surface = button.closest('[data-sidebar-surface]')
    if (!surface) throw new Error('The sidebar must be ready.')
    const nextFrame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const width = () => surface.getBoundingClientRect().width
    const deadline = performance.now() + 2000

    button.click()
    while (width() < 96 && performance.now() < deadline) await nextFrame()
    if (width() < 96 || width() >= 256) {
      throw new Error('The sidebar must be midway through opening.')
    }
    button.click()
    while (width() > 64 && performance.now() < deadline) await nextFrame()
    if (width() !== 64) throw new Error('The sidebar must finish closing.')
  })
  await expectMenuLeadingEdgeClickable(page)
})
