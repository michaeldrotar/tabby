import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'

const setChasePaused = (
  cat: Locator,
  paused: boolean,
  when: 'now' | 'click' = 'now',
) =>
  cat.evaluate(
    (element, { paused, when }) => {
      const update = () => {
        for (const animation of element.getAnimations()) {
          if (paused) animation.pause()
          else animation.play()
        }
      }
      if (when === 'click')
        window.addEventListener('click', update, { once: true })
      else update()
    },
    { paused, when },
  )

test('an idle chase pins its mouse and finishes through movement and further clicks', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('./')
  const home = page.locator('.footer-cat-home')
  const cat = page.locator('.footer-cat')
  const bait = page.locator('.footer-cat-bait')
  await home.scrollIntoViewIfNeeded()
  const bounds = (await home.boundingBox())!
  const x = bounds.x + bounds.width / 2 + 100
  const y = bounds.y - 60
  const cursor = () =>
    page.evaluate(() => getComputedStyle(document.body).cursor)

  await page.mouse.move(x + 200, y)
  await page.waitForTimeout(1800)
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect.poll(cursor).not.toBe('none')

  await page.mouse.move(x, y)
  await expect.poll(cursor).toContain('url(')
  await page.mouse.move(x + 200, y)
  await expect.poll(cursor).not.toContain('url(')
  await page.mouse.move(x, y)
  await expect.poll(() => bait.isVisible(), { intervals: [20] }).toBe(true)
  await setChasePaused(cat, true)
  await expect.poll(cursor).toBe('none')
  await page.mouse.move(x, y)
  await expect.poll(cursor).toBe('none')
  await expect(cat.locator('.footer-cat-expression')).toHaveCSS('opacity', '1')
  await page.mouse.move(x + 50, y)
  await page.mouse.click(x + 70, y)
  await page.keyboard.press('Escape')
  const pinned = (await bait.boundingBox())!
  expect(pinned.x + 3).toBeCloseTo(x, 0)
  expect(pinned.y + 5).toBeCloseTo(y, 0)
  await expect.poll(cursor).toBe('auto')
  await setChasePaused(cat, false)

  await expect
    .poll(() => cat.getAttribute('data-phase'), { intervals: [20] })
    .toBe('eating')
  const caught = (await cat.boundingBox())!
  expect(caught.x + caught.width / 2).toBeCloseTo(x, 0)
  expect(caught.y + caught.height * 0.8).toBeCloseTo(y, 0)
  await expect(bait).toBeHidden()
  await expect
    .poll(() => cat.getAttribute('data-phase'), { intervals: [20] })
    .toBe('returning')
  await page.mouse.click(x + 60, y)
  await expect(cat).not.toHaveAttribute('data-phase')
  const returned = (await cat.boundingBox())!
  expect(returned.x).toBeCloseTo(bounds.x, 0)
  expect(returned.y).toBeCloseTo(bounds.y, 0)
  await page.waitForTimeout(1800)
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect(bait).toBeHidden()
  await expect.poll(cursor).toBe('auto')
  await page.mouse.move(x + 1, y)
  await expect.poll(cursor).toContain('url(')
})

test('a click hides the cursor until movement without interrupting play', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('./')
  const home = page.locator('.footer-cat-home')
  const cat = page.getByRole('button', { name: 'Play with Tabby' })
  await home.scrollIntoViewIfNeeded()
  const bounds = (await home.boundingBox())!
  const x = bounds.x + 110
  const y = bounds.y - 60
  await page.mouse.click(x, y)
  const bait = page.locator('.footer-cat-bait')
  await expect(bait).toBeVisible({ timeout: 300 })
  const placed = (await bait.boundingBox())!
  expect(Math.abs(placed.x + 3 - x)).toBeLessThan(1)
  expect(Math.abs(placed.y + 5 - y)).toBeLessThan(1)
  await expect(cat).toHaveAttribute('data-phase', 'hunting')
  await expect(page.locator('body')).toHaveCSS('cursor', 'none')
  expect((await bait.boundingBox())!.x).toBe(placed.x)
  await expect(bait).toBeHidden()
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect(page.locator('body')).toHaveCSS('cursor', 'none')
  await page.mouse.move(x + 20, y)
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none')

  await page.getByRole('button', { name: 'Play with Tabby' }).focus()
  await page.keyboard.press('Enter')
  await setChasePaused(cat, true)
  await expect(bait).toBeVisible()
  await expect(cat).toHaveAttribute('data-phase', 'hunting')
  await page.keyboard.press('Escape')
  await expect(bait).toBeVisible()
  await setChasePaused(cat, false)
  await expect(bait).toBeHidden()
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect(page.locator('body')).toHaveCSS('cursor', 'none')
  await page.mouse.move(x + 40, y)
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none')
})

test('reduced motion keeps Tabby still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  const cat = page.locator('.footer-cat')
  await cat.scrollIntoViewIfNeeded()
  await page.locator('.footer-cat-home').hover()
  await page.waitForTimeout(1800)
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none')
  await expect(page.locator('body')).toHaveCSS('cursor', /url\(/)
  await page.getByRole('button', { name: 'Play with Tabby' }).click()
  await expect(page.locator('.footer-cat-bait')).toBeHidden()
  await expect(cat).not.toHaveAttribute('data-phase')
})

test('motion preference changes stop active play', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('./whats-new')
  const cat = page.locator('.footer-cat')
  await cat.scrollIntoViewIfNeeded()
  await page.locator('.footer-cat-home').hover()
  await expect
    .poll(() => page.locator('.footer-cat-bait').isVisible(), {
      intervals: [20],
    })
    .toBe(true)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none')
  await expect(page.locator('.footer-cat-bait')).toBeHidden()
  await expect(cat).not.toHaveAttribute('data-phase')
})

test.describe('touch play', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 812 },
  })

  test('tapping places a mouse for Tabby to catch and supports another turn', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('./')
    const home = page.locator('.footer-cat-home')
    const cat = page.getByRole('button', { name: 'Play with Tabby' })
    const bait = page.locator('.footer-cat-bait')
    await home.scrollIntoViewIfNeeded()
    const bounds = (await home.boundingBox())!
    const x = bounds.x + 110
    const y = bounds.y + 20
    await setChasePaused(cat, true, 'click')
    await page.touchscreen.tap(x, y)
    await expect(bait).toBeVisible()
    const placed = (await bait.boundingBox())!
    expect(Math.abs(placed.x + 3 - x)).toBeLessThan(1)
    expect(Math.abs(placed.y + 5 - y)).toBeLessThan(1)
    await expect(cat).toHaveAttribute('data-phase', 'hunting')
    await page.touchscreen.tap(x + 20, y)
    expect((await bait.boundingBox())!.x).toBe(placed.x)
    await setChasePaused(cat, false)
    await expect(bait).toBeHidden()
    await expect(cat).not.toHaveAttribute('data-phase')
    await cat.tap()
    await expect(bait).toBeVisible()
    await expect(cat).toHaveAttribute('data-phase', 'hunting')
    await page.evaluate(() => window.scrollBy(0, -100))
    await expect(bait).toBeHidden()
    await expect(cat).not.toHaveAttribute('data-phase')
  })
})
