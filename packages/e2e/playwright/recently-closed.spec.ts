import browser from '../../../scripts/preview/recently-closed-browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({ browserData: { ...browser, preferences: { theme: 'light' } } })

test('browses and restores a particular closed window with keyboard controls and live updates', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/tab-manager/index.html')
  // Keep the first load pending so the loading state can be observed.
  await page.evaluate(() => {
    const load = chrome.sessions.getRecentlyClosed
    chrome.sessions.getRecentlyClosed = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return load()
    }
  })
  await page.locator('[data-window-picker-trigger]').click()
  await page
    .getByRole('combobox', { name: 'Tab manager view' })
    .selectOption('recently-closed')
  const section = page.getByRole('region', { name: 'Recently closed items' })
  await expect(section.getByRole('status')).toHaveText(
    'Loading recently closed items…',
  )
  await expect(section.locator('summary')).toHaveCount(2)
  await expect(section).toContainText('25 closed tabs and windows combined')
  await expect(section).toContainText('A single closed tab')
  await expect(page.locator('[data-tab-pane]')).toHaveCount(0)
  await expect(page.locator('[data-window-picker-trigger]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'More actions' })).toHaveCount(
    0,
  )
  await expect(section.locator('summary').last()).toContainText('3 tabs')
  await expect(section.locator('time').last()).toHaveAttribute(
    'datetime',
    new Date(1792936200000).toISOString(),
  )
  await page.getByRole('combobox', { name: 'Tab manager view' }).focus()
  await page.keyboard.press('Tab')
  await expect(
    section.getByRole('button', { name: 'Restore tab' }),
  ).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(section.locator('summary').first()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(section.locator('summary').last()).toBeFocused()
  await page.keyboard.press('Enter')
  const preview = section.locator('details[open]')
  await expect(preview.getByRole('listitem')).toHaveText([
    'Research for the next project',
    'Design references',
    'Project notes',
  ])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.keyboard.press('Tab')
  await expect(
    preview.getByRole('button', { name: 'Restore entire window' }),
  ).toBeFocused()
  await page.setViewportSize({ width: 480, height: 640 })
  await page.screenshot({
    path: '../../test-results/recently-closed-items.png',
  })
  await page.keyboard.press('Enter')
  await expect(section.locator('summary')).toHaveCount(1)
  expect(
    await page.evaluate(async () =>
      (await chrome.tabs.query({})).map((tab) => tab.url),
    ),
  ).toEqual(
    expect.arrayContaining([
      'https://developer.chrome.com/docs/extensions',
      'https://example.com/design',
      'https://example.com/notes',
    ]),
  )
  expect(
    await page.evaluate(async () =>
      (await chrome.tabs.query({})).some(
        (tab) => tab.url === 'https://example.com/reading',
      ),
    ),
  ).toBe(false)
  await page.setViewportSize({ width: 480, height: 640 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page
    .getByRole('combobox', { name: 'Tab manager view' })
    .selectOption('tabs')
  await expect(page.locator('[data-window-choice="1"]')).toBeVisible()
  await page.locator('[data-window-picker-trigger]').click()
  await expect(
    page.locator('[data-tab-id="1"] [data-tab-option]'),
  ).toHaveAttribute('aria-selected', 'true')
  await expect(section).toHaveCount(0)
  await page
    .getByRole('combobox', { name: 'Tab manager view' })
    .selectOption('recently-closed')
  await section.getByRole('button', { name: 'Restore tab' }).click()
  await expect(section.locator('[data-closed-tab]')).toHaveCount(0)
  expect(
    await page.evaluate(async () =>
      (await chrome.tabs.query({})).some(
        (tab) => tab.url === 'https://example.com/standalone',
      ),
    ),
  ).toBe(true)
  // Restoring in another surface removes the window from this list too.
  await page.evaluate(async () => {
    await chrome.sessions.restore('closed-reading')
  })
  await expect(section.getByRole('status')).toHaveText(
    'No recently closed items available.',
  )
  const restoredWindowId = await page.evaluate(
    async () => (await chrome.windows.getAll()).at(-1)!.id!,
  )
  await page.evaluate(async (id) => {
    await chrome.windows.remove(id)
  }, restoredWindowId)
  await expect(section.locator('summary')).toHaveCount(1)
  await section.locator('summary').focus()
  await page.keyboard.press('Escape')
  await expect(section).toHaveCount(0)
  await expect(
    page.getByRole('combobox', { name: 'Tab manager view' }),
  ).toBeFocused()
  await expect(page.locator('[data-window-picker-trigger]')).toBeVisible()
})

test('retries unavailable history and removes an expired window after a failed restore', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  await page.evaluate(() => {
    const load = chrome.sessions.getRecentlyClosed
    chrome.sessions.getRecentlyClosed = async () => {
      chrome.sessions.getRecentlyClosed = load
      throw new Error('Sessions unavailable')
    }
  })
  await page
    .getByRole('combobox', { name: 'Tab manager view' })
    .selectOption('recently-closed')
  const section = page.getByRole('region', { name: 'Recently closed items' })
  await expect(section.getByRole('alert')).toContainText('Could not load')
  await section.getByRole('button', { name: 'Try again' }).click()
  await expect(section.locator('summary')).toHaveCount(2)
  await page.evaluate(() => {
    const load = chrome.sessions.getRecentlyClosed
    chrome.sessions.restore = async () => {
      chrome.sessions.getRecentlyClosed = async () =>
        (await load()).filter(
          (session) => session.window?.sessionId !== 'closed-research',
        )
      throw new Error('Session expired')
    }
  })
  await section.locator('summary').last().click()
  await section.getByRole('button', { name: 'Restore entire window' }).click()
  await expect(section.getByRole('alert')).toContainText(
    'may no longer be available',
  )
  await expect(section.locator('summary')).toHaveCount(1)
})

test.describe('pane navigation with a long tab list', () => {
  test.use({
    browserData: {
      ...browser,
      preferences: { theme: 'light' },
      tabs: Array.from({ length: 50 }, (_, index) => ({
        ...browser.tabs[0]!,
        id: index + 1,
        active: index === 0,
        title: `Tab ${index + 1}`,
      })),
    },
  })

  test('preserves tab scroll and handles Escape from the switcher and bottom tools', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 640 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/tab-manager/index.html')
    const viewport = page.locator('[data-radix-scroll-area-viewport]')
    await expect(page.locator('[data-tab-id="1"]')).toBeInViewport()
    await viewport.hover()
    await page.mouse.wheel(0, 1400)
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(1000)
    const scrollTop = await viewport.evaluate((element) => element.scrollTop)
    const view = page.getByRole('combobox', { name: 'Tab manager view' })
    await view.selectOption('recently-closed')
    await view.focus()
    await page.keyboard.press('Escape')
    await expect(view).toHaveValue('tabs')
    await expect(view).toBeFocused()
    await expect
      .poll(() =>
        viewport.evaluate(
          (element, savedTop) => Math.abs(element.scrollTop - savedTop),
          scrollTop,
        ),
      )
      .toBeLessThan(2)
    await expect(page.locator('[data-tab-id="1"]')).not.toBeInViewport()
    await view.selectOption('recently-closed')
    await page.getByRole('button', { name: 'Options', exact: true }).focus()
    await page.keyboard.press('Escape')
    await expect(view).toHaveValue('tabs')
    await expect(view).toBeFocused()
    await expect
      .poll(() =>
        viewport.evaluate(
          (element, savedTop) => Math.abs(element.scrollTop - savedTop),
          scrollTop,
        ),
      )
      .toBeLessThan(2)
  })
})
