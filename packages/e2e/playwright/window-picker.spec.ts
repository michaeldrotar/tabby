import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: { ...browser, preferences: { theme: 'system' } } })

test('keeps one full-width pane and usable window navigation at sidebar and wider sizes', async ({
  page,
}) => {
  for (const { width, colorScheme } of [
    { width: 320, colorScheme: 'dark' },
    { width: 480, colorScheme: 'light' },
    { width: 900, colorScheme: 'dark' },
  ] as const) {
    await page.setViewportSize({ width, height: 640 })
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
    await page.goto('/tab-manager/index.html')
    await expect(page.locator('[data-tab-pane]')).toBeVisible()
    const bounds = await page.locator('main').boundingBox()
    expect(bounds?.x).toBe(0)
    expect(bounds?.width).toBe(width)
    await page.locator('[data-window-picker-trigger]').click()
    await expect(page.getByRole('textbox')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Back to tabs' }),
    ).toHaveCount(0)
    await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
    const newWindow = page.getByRole('button', {
      name: 'New window',
      exact: true,
    })
    expect((await newWindow.boundingBox())!.height).toBe(
      (await page.locator('[data-window-choice="1"]').boundingBox())!.height,
    )
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'Search everything' }),
    ).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(newWindow).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('[data-window-picker-trigger]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
    await expect(page.getByLabel('Viewed window')).toHaveCount(0)
    const closeOther = page.getByRole('button', {
      name: 'Close window: Reading room',
      exact: true,
    })
    await page.mouse.move(0, 0)
    await expect
      .poll(() =>
        closeOther.evaluate((button) => getComputedStyle(button).opacity),
      )
      .toBe('0')
    await page.locator('[data-window-choice="2"]').hover()
    await expect
      .poll(() =>
        closeOther.evaluate((button) => getComputedStyle(button).opacity),
      )
      .toBe('1')
    await page.mouse.move(0, 0)
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('[data-window-choice="2"]')).toBeFocused()
    await expect
      .poll(() =>
        closeOther.evaluate((button) => getComputedStyle(button).opacity),
      )
      .toBe('1')
    await page.keyboard.press('End')
    await expect(
      page.getByRole('button', { name: 'New window', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'Search everything' }),
    ).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(newWindow).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(
      page.getByRole('button', { name: 'Search everything' }),
    ).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(
      page.getByRole('button', { name: 'New window', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('[data-window-picker-trigger]')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
    await page.keyboard.press('End')
    await page.keyboard.press('ArrowUp')
    await expect(page.locator('[data-window-choice="12"]')).toBeFocused()
    await expect(page.locator('[data-window-choice="12"]')).toBeInViewport()
    await page.locator('[data-window-choice="12"]').click()
    await page.locator('[data-window-picker-trigger]').click()
    await expect(page.locator('[data-window-choice="12"]')).toBeInViewport()
    await expect(page.locator('[data-window-choice="12"]')).toBeFocused()
    await expect(
      page.getByRole('button', { name: 'New window', exact: true }),
    ).toHaveCount(1)
    expect(
      await page
        .getByRole('button', { name: 'New window', exact: true })
        .evaluate((button) =>
          Boolean(
            document
              .querySelector('[role="list"][aria-label="Windows"]')!
              .compareDocumentPosition(button) &
            Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        ),
    ).toBe(true)
    await page.locator('[data-window-choice="4"]').click()
    await expect(page.locator('[data-window-picker-trigger]')).toContainText(
      'Product research and ideas for the next big release',
    )
    await expect(
      page.locator('[data-tab-id="104"] [data-tab-option]'),
    ).toBeFocused()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    for (const name of ['Search everything', 'Settings', 'More actions'])
      await expect(
        page.getByRole('button', { name, exact: true }),
      ).toBeInViewport()
    const tools = page.getByRole('navigation', { name: 'Tab Manager tools' })
    expect(
      await tools
        .getByRole('button')
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getAttribute('aria-label')),
        ),
    ).toEqual(['Search everything', 'Settings', 'More actions'])
    await page.screenshot({
      path: `../../test-results/appearance-tools-${width}.png`,
    })
    const search = await tools
      .getByRole('button', { name: 'Search everything' })
      .boundingBox()
    const settings = await tools
      .getByRole('button', { name: 'Settings' })
      .boundingBox()
    const more = await tools
      .getByRole('button', { name: 'More actions' })
      .boundingBox()
    expect(search!.x).toBeLessThan(20)
    expect(settings!.x - search!.x).toBeLessThan(50)
    expect(more!.x + more!.width).toBeGreaterThan(width - 20)
  }
})

test('recovers picker focus when the displayed window closes', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  await page.locator('[data-window-picker-trigger]').click()
  await page.locator('[data-window-choice="1"]').focus()
  await page.evaluate(async () => {
    await chrome.windows.remove(1)
  })
  await expect(page.locator('[data-window-choice="2"]')).toBeFocused()
})

test('focuses the chosen window tab after the picker animation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tab-manager/index.html')
  await page.locator('[data-window-picker-trigger]').click()
  await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('[data-window-choice="2"]')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(
    page.locator('[data-tab-id="9"] [data-tab-option]'),
  ).toBeFocused()
})
