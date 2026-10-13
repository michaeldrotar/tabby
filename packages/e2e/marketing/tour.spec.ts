import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 960, height: 720 }, video: 'on' })

test('the guided tour reaches its final project and can replay', async ({
  page,
}) => {
  await page.goto('./?capture')
  const demo = page.locator('[data-demo]')
  await expect(demo).toHaveClass(/product-demo/)
  await expect(demo).toHaveClass(/capture-demo/)
  await expect(demo.getByRole('button', { name: 'Play tour' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  const capture = process.env.TABBY_CAPTURE_MARKETING === '1'
  const media = resolve('../../pages/marketing/public/media')
  if (capture)
    await page.screenshot({ path: resolve(media, 'tour-poster.png') })
  await demo.getByRole('button', { name: 'Play tour' }).click()
  await expect(
    demo.getByText('Select three tabs together', { exact: true }),
  ).toBeVisible({ timeout: 5000 })
  await expect(
    demo.getByRole('status', { name: '0 windows, 0 tab groups, 3 tabs' }),
  ).toBeVisible()
  await expect(
    demo.getByText('Give that project a home', { exact: true }),
  ).toBeVisible({ timeout: 5000 })
  await expect(demo.getByText('Launch', { exact: true })).toBeVisible()
  await expect(
    demo.getByText('Find tabs, bookmarks, and history', { exact: true }),
  ).toBeVisible({ timeout: 5000 })
  await expect(
    demo.getByText('Design references', { exact: true }),
  ).toBeVisible()
  await expect(
    demo.getByText('Choose a look that feels like you', { exact: true }),
  ).toBeVisible({ timeout: 5000 })
  await expect(demo.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await expect(
    demo.getByText('A little order. Back to your day.', { exact: true }),
  ).toBeVisible({ timeout: 5000 })
  if (capture) {
    const recording = page.video()!
    await page.waitForTimeout(1000)
    await page.close()
    await recording.saveAs(resolve(media, 'tabby-tour.webm'))
    return
  }
  await demo.getByRole('button', { name: 'Replay tour' }).click()
  await expect(
    demo.getByText('All your windows, in one place', { exact: true }),
  ).toBeVisible()
  await expect(demo.getByText('Launch', { exact: true })).toHaveCount(0)
})
