import browser from '../../../scripts/preview/browser-data.json' with { type: 'json' }
import { expect, test } from './fixtures'

test.use({
  browserData: {
    ...browser,
    followOpenedWindow: false,
    preferences: { theme: 'system' },
  },
})

test('manages another window in place and switches only with an explicit action', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/tab-manager/index.html')
  const picker = page.locator('[data-window-picker-trigger]')
  const remoteActions = page.getByRole('button', {
    name: 'Show current window',
    exact: true,
  })
  const focusedWindow = () =>
    page.evaluate(async () => (await chrome.windows.getLastFocused()).id)
  const localTabs = () =>
    page.evaluate(async () =>
      (await chrome.tabs.query({ windowId: 1 })).map((tab) => tab.id),
    )
  const originalTabs = await localTabs()
  await page.keyboard.down('Shift')
  await picker.click()
  await expect(
    page.locator('[data-window-choice="1"] [data-window-modifier-action]'),
  ).toHaveAttribute('aria-label', 'Switch windows')
  await page.keyboard.up('Shift')
  await expect(page.locator('[data-window-choice="1"]')).toContainText('6 tabs')
  await expect(
    page.getByRole('combobox', { name: 'Window focus' }),
  ).toHaveCount(0)
  await expect(page.getByText(/Click to |Click a window to/)).toHaveCount(0)
  const hint = page.locator('[data-window-modifier-action]')
  const reading = page.locator('[data-window-choice="2"]')
  const design = page.locator('[data-window-choice="3"]')
  await page.setViewportSize({ width: 320, height: 640 })
  await reading.hover()
  await expect(hint).toHaveCount(0)
  for (const key of ['Control', 'Meta']) {
    await page.keyboard.down(key)
    await expect(hint).toHaveCount(0)
    await page.keyboard.up(key)
  }
  await page.keyboard.down('Shift')
  await expect(
    reading.locator('[data-window-modifier-action]'),
  ).toHaveAttribute('aria-label', 'Switch windows')
  await expect(hint).toHaveCount(1)
  await page.screenshot({
    path: '../../test-results/window-picker-shift-320.png',
  })
  await design.hover()
  await expect(design.locator('[data-window-modifier-action]')).toHaveAttribute(
    'aria-label',
    'Switch windows',
  )
  await expect(hint).toHaveCount(1)
  await page.keyboard.up('Shift')
  await expect(hint).toHaveCount(0)
  await page.keyboard.press('ArrowDown')
  await expect(reading).toBeFocused()
  await page.keyboard.down('Shift')
  await expect(
    reading.locator('[data-window-modifier-action]'),
  ).toHaveAttribute('aria-label', 'Switch windows')
  await page.keyboard.up('Shift')
  await expect(hint).toHaveCount(0)
  await page.setViewportSize({ width: 480, height: 640 })
  await page.locator('[data-window-choice="2"]').click()
  await expect(picker).toContainText('Reading room')
  await expect(remoteActions).toBeVisible()
  expect(await focusedWindow()).toBe(1)
  expect((await page.locator('header').boundingBox())!.height).toBeLessThan(85)
  await page.evaluate(async () => {
    await chrome.windows.update(2, { focused: true })
    await chrome.windows.update(1, { focused: true })
  })
  await expect(picker).toContainText('Reading room')
  await expect(remoteActions).toBeVisible()
  await page.evaluate(async () => {
    await chrome.runtime.sendMessage({
      type: 'TAB_MANAGER_WINDOW_ACTIVATED',
      windowId: 1,
    })
    await chrome.storage.session.set({ 'tabby-moved-tabs-1': [1] })
    await chrome.runtime.sendMessage({
      type: 'TAB_MANAGER_WINDOW_ACTIVATED',
      windowId: 1,
      tabIds: [1],
    })
  })
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await chrome.storage.session.get('tabby-moved-tabs-1'))[
            'tabby-moved-tabs-1'
          ],
      ),
    )
    .toBeUndefined()
  await expect(picker).toContainText('Reading room')
  await expect(
    page.locator('[data-tab-id="7"] [data-tab-option]'),
  ).toHaveAttribute('aria-selected', 'true')
  await page.screenshot({
    path: '../../test-results/manage-other-window-480.png',
  })
  const music = page.locator('[data-tab-id="8"]')
  await music.hover()
  await music.getByRole('button', { name: 'Close tab', exact: true }).click()
  await expect(music).toHaveCount(0)
  expect(await localTabs()).toEqual(originalTabs)
  expect(await focusedWindow()).toBe(1)
  await expect(picker).toContainText('2 tabs')
  await expect(remoteActions).toBeVisible()

  await page.setViewportSize({ width: 320, height: 640 })
  await expect(
    page.getByRole('button', { name: 'Switch to this window', exact: true }),
  ).toBeInViewport()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: '../../test-results/manage-other-window-320.png',
  })
  await page
    .getByRole('button', { name: 'Show current window', exact: true })
    .click()
  await expect(picker).toContainText('Tabby')
  await expect(remoteActions).toHaveCount(0)
  await expect(page.locator('[data-tab-id="1"]')).toBeVisible()

  await picker.click()
  await page.locator('[data-window-choice="2"]').click()
  await page
    .getByRole('button', { name: 'Switch to this window', exact: true })
    .click()
  await expect.poll(focusedWindow).toBe(2)
  await expect(picker).toContainText('Reading room')
  await expect(remoteActions).toBeVisible()
  expect(
    await page.evaluate(async () => (await chrome.windows.getCurrent()).id),
  ).toBe(1)

  await page.evaluate(async () => chrome.windows.update(1, { focused: true }))
  await picker.click()
  await page.locator('[data-window-choice="2"]').click({ modifiers: ['Shift'] })
  await expect.poll(focusedWindow).toBe(2)
  await page.evaluate(async () => chrome.windows.update(1, { focused: true }))
  await picker.click()
  await page.evaluate(async () => {
    const key = 'preference-storage-key'
    const saved = (await chrome.storage.local.get(key))[key]
    await chrome.storage.local.set({
      [key]: { ...saved, tabManagerWindowClickBehavior: 'switch' },
    })
  })
  await reading.hover()
  await page.keyboard.down('Shift')
  await expect(
    reading.locator('[data-window-modifier-action]'),
  ).toHaveAttribute('aria-label', 'Stay in this window')
  await page.keyboard.up('Shift')
  await expect(hint).toHaveCount(0)
  await page.locator('[data-window-choice="2"]').click({ modifiers: ['Shift'] })
  await expect.poll(focusedWindow).toBe(1)
  await expect(remoteActions).toBeVisible()
  await picker.click()
  await page.locator('[data-window-choice="2"]').click()
  await expect.poll(focusedWindow).toBe(2)
  expect(
    await page.evaluate(
      async () =>
        (await chrome.storage.local.get('preference-storage-key'))[
          'preference-storage-key'
        ].tabManagerWindowClickBehavior,
    ),
  ).toBe('switch')
})

test('shows tentative restored names and follows corrections in the window picker', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 640 })
  await page.goto('/tab-manager/index.html')
  await page.evaluate(async () => {
    await chrome.storage.session.set({
      'tabby-window-identities': {
        1: { key: 'work', name: 'Work', icon: 'briefcase', provisional: true },
        2: {
          key: 'research',
          name: 'Research',
          icon: 'book',
          provisional: true,
        },
      },
    })
  })
  const picker = page.locator('[data-window-picker-trigger]')
  await expect(picker).toContainText('Work')
  await picker.click()
  await expect(page.locator('[data-window-choice="1"]')).toContainText('Work')
  await expect(page.locator('[data-window-choice="2"]')).toContainText(
    'Research',
  )
  await page.evaluate(async () => {
    await chrome.storage.session.set({
      'tabby-window-identities': {
        1: {
          key: 'research',
          name: 'Research',
          icon: 'book',
          provisional: true,
        },
        2: { key: 'work', name: 'Work', icon: 'briefcase', provisional: true },
      },
    })
  })
  await expect(picker).toContainText('Research')
  await expect(page.locator('[data-window-choice="1"]')).toContainText(
    'Research',
  )
  await expect(page.locator('[data-window-choice="2"]')).toContainText('Work')
  await page.locator('[data-window-choice="2"]').click()
  await expect(picker).toContainText('Work')
})

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
    const header = await page
      .locator('[data-keyboard-section="header"]')
      .boundingBox()
    expect(header!.height).toBeLessThanOrEqual(74)
    await page.locator('[data-window-picker-trigger]').click()
    const current = page.locator('[data-window-choice="1"]')
    await expect(current).not.toContainText('Current window')
    await expect(current).toContainText('6 tabs · 1 group')
    await expect(current).not.toContainText('Project notes')
    expect((await current.boundingBox())!.height).toBe(64)
    await expect(page.locator('[data-window-choice="2"]')).toContainText(
      '3 tabs',
    )
    await expect(page.locator('[data-window-choice="2"]')).not.toContainText(
      '0 groups',
    )
    await page.screenshot({
      path: `../../test-results/window-picker-${width}.png`,
    })
    await expect(page.getByRole('textbox')).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: 'Back to tabs' }),
    ).toBeInViewport()
    await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
    const newWindow = page.getByRole('button', {
      name: 'New window',
      exact: true,
    })
    expect((await newWindow.boundingBox())!.height).toBe(
      (await page.locator('[data-window-choice="1"]').boundingBox())!.height,
    )
    await page.keyboard.press('Tab')
    await expect(newWindow).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('button', { name: 'Search', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(newWindow).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('[data-window-choice="1"]')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(
      page.getByRole('button', { name: 'Edit window' }),
    ).toBeFocused()
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
      page.getByRole('button', { name: 'Search', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(newWindow).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(
      page.getByRole('button', { name: 'Search', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(
      page.getByRole('button', { name: 'New window', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Home')
    await page.keyboard.press('ArrowUp')
    await expect(
      page.getByRole('button', { name: 'Back to tabs', exact: true }),
    ).toBeFocused()
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
    for (const name of ['Search', 'Options', 'More actions'])
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
    ).toEqual(['Search', 'Options', 'More actions'])
    await page.screenshot({
      path: `../../test-results/appearance-tools-${width}.png`,
    })
    const search = await tools
      .getByRole('button', { name: 'Search', exact: true })
      .boundingBox()
    const settings = await tools
      .getByRole('button', { name: 'Options' })
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

test('keeps exits visible in a short panel and returns to the same tabs', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 320, height: 320 })
  await page.goto('/tab-manager/index.html')
  const scroll = page.locator(
    '[data-manager-scroll] [data-radix-scroll-area-viewport]',
  )
  await scroll.evaluate((element) => {
    element.scrollTop = 150
  })
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  const initialScroll = await scroll.evaluate((element) => element.scrollTop)
  const windowCount = await page.evaluate(
    async () => (await chrome.windows.getAll()).length,
  )
  const editBounds = await page
    .getByRole('button', { name: 'Edit window', exact: true })
    .boundingBox()
  const headerBounds = await page.locator('header').boundingBox()
  const icon = page.locator('[data-window-picker-trigger] > span').first()
  const iconBounds = await icon.boundingBox()
  await page.getByRole('button', { name: 'Edit window', exact: true }).click()
  await expect
    .poll(() =>
      page
        .getByRole('button', { name: 'Close editor', exact: true })
        .boundingBox(),
    )
    .toEqual(editBounds)
  await expect
    .poll(() => page.locator('header').boundingBox())
    .toEqual(headerBounds)
  await expect(icon).toBeInViewport()
  await expect
    .poll(async () => (await icon.boundingBox())!.x)
    .toBe(iconBounds!.x + 44)
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('My work')
  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  const back = page.getByRole('button', { name: 'Back to tabs', exact: true })
  await expect(back).toBeInViewport()
  const editor = page.getByRole('button', { name: 'Close editor', exact: true })
  await expect(editor).toBeInViewport()
  const editorButtonBounds = (await editor.boundingBox())!
  const backButtonBounds = (await back.boundingBox())!
  expect(editorButtonBounds.y + editorButtonBounds.height / 2).toBe(
    backButtonBounds.y + backButtonBounds.height / 2,
  )
  await page.screenshot({ path: '../../test-results/short-window-editor.png' })
  await back.click()
  await expect(page.locator('[data-window-editor]')).toHaveCount(0)
  await expect
    .poll(async () => (await icon.boundingBox())!.x)
    .toBe(iconBounds!.x)
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBe(initialScroll)
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'My work',
  )
  await page.locator('[data-window-picker-trigger]').click()
  await expect(back).toBeVisible()
  await expect(page.locator('[data-window-choice="1"]')).toHaveAttribute(
    'aria-current',
    'true',
  )
  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(back).toBeInViewport()
  await back.click()
  await expect(page.locator('[data-window-picker]')).toHaveCount(0)
  await expect
    .poll(() => scroll.evaluate((element) => element.scrollTop))
    .toBe(initialScroll)
  expect(
    await page.evaluate(async () => (await chrome.windows.getAll()).length),
  ).toBe(windowCount)
  await page.getByRole('button', { name: 'Edit window', exact: true }).click()
  await editor.click()
  await expect(page.locator('[data-window-editor]')).toHaveCount(0)
  await expect(page.locator('[data-window-picker-trigger]')).toContainText(
    'My work',
  )
})
