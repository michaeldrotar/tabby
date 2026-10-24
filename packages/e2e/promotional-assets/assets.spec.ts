import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  promoTileAssets,
  screenshotAssets,
} from '../../../pages/promotional-assets/src/data/promoAssets'

test('promotional layouts show current windows, search, and batch actions', async ({
  page,
}) => {
  const capture = process.env.TABBY_CAPTURE_PROMOS === '1'
  for (const asset of [...screenshotAssets, ...promoTileAssets].filter(
    (asset) =>
      !process.env.TABBY_PROMO_ASSET ||
      asset.id === process.env.TABBY_PROMO_ASSET,
  )) {
    await page.setViewportSize({ width: asset.width, height: asset.height })
    await page.goto(`./?asset=${asset.id}`)
    const canvas = page.getByRole('main', { name: 'Tabby promotional asset' })
    await expect(canvas).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() =>
      Array.from(document.images).every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    )
    if (asset.id === 'overview')
      expect(
        await page
          .locator('.overview-manager')
          .evaluate((element) => element.clientWidth),
      ).toBe(504)
    if (asset.id === 'marquee-promo') {
      expect(
        await page
          .locator('.marquee-promo-manager')
          .evaluate((element) => element.clientWidth),
      ).toBe(465)
      expect(
        await page
          .locator('.marquee-promo-omnibar')
          .evaluate((element) => element.clientWidth),
      ).toBe(536)
    }
    if (asset.id === 'themes') {
      await expect(page.locator('.theme-preset-swatch')).toHaveCount(15)
      const palette = await page.locator('.themes-palette').boundingBox()
      const frame = await canvas.boundingBox()
      expect(palette!.y + palette!.height).toBeLessThanOrEqual(
        frame!.y + frame!.height - 16,
      )
    }
    if (asset.id === 'find-anything')
      await expect(
        page.getByRole('option', { name: /Customer inbox.*Window/ }),
      ).toBeVisible()
    if (asset.id === 'project-windows') {
      await expect(
        page.getByRole('textbox', { name: 'Name', exact: true }),
      ).toHaveValue('Design studio')
      await expect(page.locator('[data-window-choice]')).toHaveCount(4)
    }
    if (asset.id === 'bulk-actions') {
      const highlighted = page.locator('[data-action-id="discard"]')
      await expect(highlighted).toBeVisible()
      expect(
        await highlighted.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      ).not.toBe('rgba(0, 0, 0, 0)')
    }
    if (capture) {
      const file = asset.screenshotNumber
        ? `screenshots/${String(asset.screenshotNumber).padStart(2, '0')}-${asset.id}.jpg`
        : `promo-tiles/${asset.id === 'small-promo' ? 'small-440-280' : 'marquee-1400-560'}.jpg`
      const path = resolve('../../product/promotional-assets', file)
      mkdirSync(dirname(path), { recursive: true })
      await canvas.screenshot({ path, type: 'jpeg', quality: 94 })
    }
  }
})
