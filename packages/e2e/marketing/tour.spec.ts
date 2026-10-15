import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 960, height: 720 },
  video: { mode: 'on', size: { width: 960, height: 720 } },
})

test('the guided tour reaches its final project and can replay', async ({
  page,
}, testInfo) => {
  await page.goto('./?capture')
  const demo = page.locator('[data-browser-demo]')
  await expect(demo).toHaveAttribute('data-capture', 'true')
  await expect(demo.locator('.browser-demo-controls')).toBeHidden()
  await expect(demo.locator('.demo-bar,.demo-tools')).toHaveCount(0)
  await page.evaluate(() => document.fonts.ready)
  const capture = process.env.TABBY_CAPTURE_MARKETING === '1'
  const media = resolve('../../pages/marketing/public/media')
  if (capture)
    await page.screenshot({ path: resolve(media, 'tour-poster.png') })
  const playbackStart = await page.evaluate(() => performance.now() / 1000)
  await demo
    .getByRole('button', { name: 'Play tour', includeHidden: true })
    .evaluate((button: HTMLButtonElement) => button.click())
  await expect(demo.locator('.browser-demo-caption')).toHaveText(
    'Select three tabs together',
    { timeout: 5000 },
  )
  await expect(
    demo.getByRole('button', { name: 'More actions', exact: true }),
  ).toBeVisible()
  await expect(demo.locator('.browser-demo-caption')).toHaveText(
    'Give that project a home',
    { timeout: 5000 },
  )
  await expect(demo.getByText('Launch', { exact: true })).toBeVisible()
  await expect(demo.locator('.browser-demo-caption')).toHaveText(
    'Find windows, tabs, and saved pages',
    { timeout: 5000 },
  )
  await expect(
    demo.getByText('Design references', { exact: true }),
  ).toBeVisible()
  await expect(demo.locator('.browser-demo-caption')).toHaveText(
    'Choose a look that feels like you',
    { timeout: 5000 },
  )
  await expect(demo.locator('.browser-manager-surface')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await expect(demo.locator('.browser-demo-caption')).toHaveText(
    'A little order. Back to your day.',
    { timeout: 5000 },
  )
  if (capture) {
    const recording = page.video()!
    await expect(
      demo.getByRole('button', { name: 'Replay tour', includeHidden: true }),
    ).toBeAttached()
    // Hold the final scene through the last caption and music fade.
    await page.waitForTimeout(3500)
    await page.close()
    const silentVideo = testInfo.outputPath('tour-recording.webm')
    await recording.saveAs(silentVideo)
    execFileSync(process.env.FFMPEG_PATH ?? 'ffmpeg', [
      '-y',
      '-ss',
      String(playbackStart),
      '-i',
      silentVideo,
      '-i',
      resolve(media, 'tabby-tour-audio.ogg'),
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-t',
      '16.3',
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '30',
      '-b:v',
      '0',
      '-c:a',
      'copy',
      resolve(media, 'tabby-tour.webm'),
    ])
    return
  }
  await demo
    .getByRole('button', { name: 'Replay tour', includeHidden: true })
    .evaluate((button: HTMLButtonElement) => button.click())
  await expect(demo.locator('.browser-demo-caption')).toHaveText(
    'All your windows, in one place',
  )
  await expect(demo.getByText('Launch', { exact: true })).toHaveCount(0)
})
