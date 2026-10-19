import { expect, test } from './fixtures'
import type { Locator, Page } from '@playwright/test'

const background = (element: Locator) =>
  element.evaluate((node) => getComputedStyle(node).backgroundColor)

const color = (
  element: Locator,
  property: 'backgroundColor' | 'color' = 'backgroundColor',
) =>
  element.evaluate((node, property) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    context.fillStyle = getComputedStyle(node)[property]
    context.fillRect(0, 0, 1, 1)
    return Array.from(context.getImageData(0, 0, 1, 1).data)
  }, property)

const contrast = (element: Locator) =>
  element.evaluate((node) => {
    const context = document.createElement('canvas').getContext('2d')!
    const rgba = (value: string) => {
      context.clearRect(0, 0, 1, 1)
      context.fillStyle = value
      context.fillRect(0, 0, 1, 1)
      return Array.from(context.getImageData(0, 0, 1, 1).data)
    }
    const blend = (front: number[], back: number[]) =>
      back.map(
        (channel, index) =>
          front[index]! * (front[3]! / 255) + channel * (1 - front[3]! / 255),
      )
    const ancestors = []
    for (
      let parent: Element | null = node;
      parent;
      parent = parent.parentElement
    )
      ancestors.unshift(parent)
    const background = ancestors.reduce(
      (background, parent) =>
        blend(rgba(getComputedStyle(parent).backgroundColor), background),
      [255, 255, 255],
    )
    const luminance = (rgb: number[]) =>
      rgb.reduce((sum, value, index) => {
        const channel = value / 255
        return (
          sum +
          [0.2126, 0.7152, 0.0722][index]! *
            (channel <= 0.04045
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4)
        )
      }, 0)
    const text = luminance(
      blend(rgba(getComputedStyle(node).color), background),
    )
    const base = luminance(background)
    return (Math.max(text, base) + 0.05) / (Math.min(text, base) + 0.05)
  })

const updatePreferences = (
  page: Page,
  patch: Record<string, string | number>,
) =>
  page.evaluate(async (patch) => {
    const key = 'preference-storage-key'
    const stored = await chrome.storage.local.get(key)
    await chrome.storage.local.set({ [key]: { ...stored[key], ...patch } })
  }, patch)

test('keeps the compact appearance drawer open while trying palettes and using other controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  const toggle = page.getByRole('button', { name: 'Appearance', exact: true })
  const drawer = page.getByRole('region', { name: 'Appearance', exact: true })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await drawer.getByRole('button', { name: 'Dark', exact: true }).click()
  await drawer
    .getByRole('button', { name: 'Background: mauve', exact: true })
    .click()
  await drawer
    .getByRole('button', { name: 'Foreground: mist', exact: true })
    .click()
  await drawer
    .getByRole('button', { name: 'Accent: rose', exact: true })
    .click()
  await expect(drawer.getByRole('slider')).toHaveCount(0)
  await expect(page.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'rose',
  )
  await page.locator('[data-tab-option]').last().click()
  await page.locator('[data-window-picker-trigger]').click()
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Edit window' }).click()
  await expect(drawer).toBeVisible()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await drawer.getByRole('button', { name: 'Light', exact: true }).click()
  await drawer
    .getByRole('button', { name: 'Background: taupe', exact: true })
    .click()
  await drawer
    .getByRole('button', { name: 'Foreground: olive', exact: true })
    .click()
  await drawer
    .getByRole('button', { name: 'Accent: teal', exact: true })
    .click()
  await drawer.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(
    drawer.getByRole('button', { name: 'Accent: rose', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(
    await page.evaluate(
      async () =>
        (await chrome.storage.local.get('preference-storage-key'))[
          'preference-storage-key'
        ],
    ),
  ).toMatchObject({
    theme: 'dark',
    themeDarkBackground: 'mauve',
    themeDarkForeground: 'mist',
    themeDarkAccent: 'rose',
    themeLightAccent: 'teal',
    themeLightBackground: 'taupe',
    themeLightForeground: 'olive',
  })
  await page.setViewportSize({ width: 320, height: 640 })
  await expect(drawer).toBeInViewport()
  expect((await drawer.boundingBox())!.height).toBeLessThan(250)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await toggle.click()
  await expect(drawer).toHaveCount(0)
  await toggle.click()
  await expect(drawer).toBeVisible()
})

for (const theme of ['dark', 'light'] as const) {
  test(`keeps ${theme} appearance settings and pointer and keyboard states distinct`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 640 })
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
    await page.goto('/tab-manager/index.html')
    const prefix = theme === 'dark' ? 'themeDark' : 'themeLight'
    const shell = page.locator('[data-tab-manager-shell]')
    const header = page.locator('header')
    const switcher = page.locator('[data-window-picker-trigger]')
    const row = page.locator('[data-tab-item][data-active="true"]')
    const fill = row.locator(':scope > div').first()
    await expect(row).toBeVisible()
    expect(await background(shell)).not.toBe(await background(header))

    const originalCanvas = await background(shell)
    await updatePreferences(page, { [`${prefix}Background`]: 'slate' })
    await expect.poll(() => background(shell)).not.toBe(originalCanvas)
    if (theme === 'light') {
      const coolCanvas = await color(shell)
      expect(coolCanvas[2]! - coolCanvas[0]!).toBeGreaterThan(10)
      const chrome = await color(header)
      expect(
        chrome.slice(0, 3).reduce((sum, channel) => sum + channel, 0),
      ).toBeLessThan(
        coolCanvas.slice(0, 3).reduce((sum, channel) => sum + channel, 0),
      )
    }
    const title = row.locator('[data-tab-option] > div').first()
    const originalText = await title.evaluate(
      (node) => getComputedStyle(node).color,
    )
    await updatePreferences(page, { [`${prefix}Foreground`]: 'stone' })
    await expect
      .poll(() => title.evaluate((node) => getComputedStyle(node).color))
      .not.toBe(originalText)
    if (theme === 'light') {
      const warmInk = await color(title, 'color')
      expect(warmInk[0]! - warmInk[2]!).toBeGreaterThan(25)
      const secondaryInk = await color(
        page.getByText('github.com', { exact: true }),
        'color',
      )
      expect(secondaryInk[0]! - secondaryInk[2]!).toBeGreaterThan(20)
    }

    const switcherBase = await background(switcher)
    await updatePreferences(page, {
      [`${prefix}Accent`]: 'blue',
    })
    await expect(page.locator('[data-surface]')).toHaveAttribute(
      'data-theme-accent',
      'blue',
    )
    await fill.evaluate(async (node) => {
      await Promise.all(
        node.getAnimations().map((animation) => animation.finished),
      )
    })
    const blue = await color(fill)
    await updatePreferences(page, { [`${prefix}Accent`]: 'rose' })
    await expect.poll(() => color(fill)).not.toEqual(blue)
    expect(await background(switcher)).toBe(switcherBase)
    const resting = await color(fill)
    await row.hover()
    await expect.poll(() => color(fill)).not.toEqual(resting)

    await updatePreferences(page, { [`${prefix}Accent`]: 'yellow' })
    await expect(page.locator('[data-surface]')).toHaveAttribute(
      'data-theme-accent',
      'yellow',
    )
    for (const text of ['Project notes', 'docs.google.com'])
      expect(
        await contrast(row.getByText(text, { exact: true })),
      ).toBeGreaterThanOrEqual(4.5)
    const createTab = page.getByRole('button', { name: 'New tab', exact: true })
    await createTab.hover()
    expect(
      await contrast(createTab.getByText('New tab')),
    ).toBeGreaterThanOrEqual(4.5)
    await switcher.hover()
    const neutralHover = await background(switcher)
    await updatePreferences(page, { [`${prefix}Accent`]: 'teal' })
    await expect(page.locator('[data-surface]')).toHaveAttribute(
      'data-theme-accent',
      'teal',
    )
    expect(await background(switcher)).toBe(neutralHover)
    expect(
      await contrast(switcher.getByText('4 tabs', { exact: true })),
    ).toBeGreaterThanOrEqual(4.5)

    await switcher.click()
    const currentWindow = page.locator('[data-window-choice="1"]')
    await expect(currentWindow).toBeVisible()
    const windowResting = await color(currentWindow)
    await currentWindow.hover()
    await expect.poll(() => color(currentWindow)).not.toEqual(windowResting)
    expect(
      await contrast(currentWindow.getByText('4 tabs', { exact: true })),
    ).toBeGreaterThanOrEqual(4.5)
    await page.keyboard.press('Escape')
    await page.keyboard.press('ArrowDown')
    const option = row.locator('[data-tab-option]')
    await expect(option).toBeFocused()
    expect(
      await option.evaluate((node) => node.matches(':focus-visible')),
    ).toBe(true)
    const keyboardRing = await row.evaluate(
      (node) => getComputedStyle(node, '::after').boxShadow,
    )
    expect(keyboardRing).not.toBe('none')
    await row.hover()
    await expect
      .poll(() =>
        row.evaluate((node) => getComputedStyle(node, '::after').boxShadow),
      )
      .toBe('none')
    await option.click()
    await expect(option).toBeFocused()
    expect(
      await row.evaluate((node) => getComputedStyle(node).outlineStyle),
    ).toBe('none')
    expect(
      await row.evaluate((node) => getComputedStyle(node, '::after').boxShadow),
    ).toBe('none')
    await page.keyboard.press('ArrowDown')
    const nextRow = page.locator('[data-tab-item]').nth(1)
    await expect(nextRow.locator('[data-tab-option]')).toBeFocused()
    expect(
      await nextRow.evaluate(
        (node) => getComputedStyle(node, '::after').boxShadow,
      ),
    ).toBe(keyboardRing)
    if (theme === 'light') {
      await updatePreferences(page, {
        themeLightBackground: 'stone',
        themeLightForeground: 'gray',
        themeLightAccent: 'indigo',
      })
      const warmCanvas = await color(shell)
      expect(warmCanvas[0]! - warmCanvas[2]!).toBeGreaterThan(15)
      await option.click()
      await row.hover()
      for (const text of ['Project notes', 'docs.google.com'])
        expect(
          await contrast(row.getByText(text, { exact: true })),
        ).toBeGreaterThanOrEqual(4.5)
      await switcher.click()
      await currentWindow.hover()
      expect(
        await contrast(currentWindow.getByText('4 tabs', { exact: true })),
      ).toBeGreaterThanOrEqual(4.5)
    }
  })
}
