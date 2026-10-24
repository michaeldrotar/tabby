import { expect, test } from '@playwright/test'

test('footer Tabby catches a resting nearby cursor and lets it escape on movement', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('./')
  const home = page.locator('.footer-cat-home')
  const cat = page.locator('.footer-cat')
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
  await expect
    .poll(async () => (await cat.boundingBox())!.x, { intervals: [50] })
    .toBeGreaterThan(bounds.x + 20)
  await expect(cat.locator('.footer-cat-expression')).toHaveCSS('opacity', '1')
  await page.mouse.move(x + 10, y)
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect.poll(cursor).not.toBe('none')

  await expect.poll(cursor, { intervals: [50] }).toBe('none')
  const caught = (await cat.boundingBox())!
  expect(caught.x + caught.width / 2).toBeCloseTo(x + 10, 0)
  expect(caught.y + caught.height * 0.8).toBeCloseTo(y, 0)
  await expect(cat).not.toHaveAttribute('data-phase')
  const returned = (await cat.boundingBox())!
  expect(returned.x).toBeCloseTo(bounds.x, 0)
  expect(returned.y).toBeCloseTo(bounds.y, 0)
  await expect.poll(cursor).toBe('none')
  await page.mouse.move(x + 1, y)
  await expect.poll(cursor).toContain('url(')

  await expect.poll(cursor).toBe('none')
  await page.keyboard.press('Tab')
  await expect.poll(cursor).not.toBe('none')
  await expect.poll(cursor).not.toContain('url(')
})

test('footer Tabby leaves the cursor alone when motion is reduced', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  const cat = page.locator('.footer-cat')
  await cat.scrollIntoViewIfNeeded()
  await page.locator('.footer-cat-home').hover()
  await page.waitForTimeout(1800)
  await expect(cat).not.toHaveAttribute('data-phase')
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none')
  await expect(page.locator('body')).toHaveCSS('cursor', /url\(/)
})

test('footer Tabby restores the cursor when motion preferences change', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('./whats-new')
  const cat = page.locator('.footer-cat')
  await cat.scrollIntoViewIfNeeded()
  await page.locator('.footer-cat-home').hover()
  await expect(page.locator('body')).toHaveCSS('cursor', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('body')).not.toHaveCSS('cursor', 'none')
  await expect(cat).not.toHaveAttribute('data-phase')
})
