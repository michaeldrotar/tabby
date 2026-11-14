import { createServer } from 'node:http'
import { expect, test } from './extension-fixtures'
import type { Page } from '@playwright/test'
import type { AddressInfo } from 'node:net'

const palettePaint = (page: Page) =>
  page.locator('[data-surface]').evaluate((surface) => {
    const paint = (token: string) => {
      const probe = document.createElement('span')
      probe.style.backgroundColor = `var(--${token})`
      surface.append(probe)
      const value = getComputedStyle(probe).backgroundColor
      probe.remove()
      return value
    }
    return {
      background: paint('background'),
      foreground: paint('foreground'),
      accent: paint('accent'),
      chrome: paint('input'),
      selection: paint('accent-selected'),
    }
  })

test('the built extension shares preferences and receives live tab changes', async ({
  page,
  context,
  extensionId,
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto(`chrome-extension://${extensionId}/options/index.html`)
  await expect(
    page.getByRole('heading', { name: 'Appearance', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Porcelain', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  const defaultPaint = await palettePaint(page)
  expect(defaultPaint.chrome).toBe(defaultPaint.background)
  await page.evaluate(async () => {
    await chrome.storage.local.set({
      'preference-storage-key': {
        theme: 'light',
        themeLightBackground: 'slate',
        themeLightAccent: 'rose',
        themeLightAccentStrength: 50,
      },
    })
  })
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Porcelain', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => palettePaint(page)).toEqual(defaultPaint)
  await expect(page.getByText('Accent strength', { exact: true })).toHaveCount(
    0,
  )
  await expect(
    page
      .getByRole('group', { name: 'Tonal themes', exact: true })
      .getByRole('button'),
  ).toHaveCount(9)
  await expect(
    page
      .getByRole('group', { name: 'Colorful themes', exact: true })
      .getByRole('button'),
  ).toHaveCount(6)
  await page
    .getByRole('group', { name: 'Theme mode', exact: true })
    .getByText('Dark', { exact: true })
    .click()
  await expect(
    page.getByRole('radio', { name: 'Dark', exact: true }),
  ).toBeChecked()
  await expect(page.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'dark',
  )
  await page.getByRole('combobox', { name: 'Window identification' }).click()
  await page.getByRole('option', { name: 'First tab', exact: true }).click()
  const manager = await context.newPage()
  await manager.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  await manager
    .getByRole('button', { name: 'Edit window', exact: true })
    .click()
  await manager
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Smoke workspace')
  await manager.getByRole('button', { name: 'Flask icon', exact: true }).click()
  await manager.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(manager.locator('[data-window-picker-trigger]')).toContainText(
    'Smoke workspace',
  )
  await manager.reload()
  await expect(manager.locator('[data-window-picker-trigger]')).toContainText(
    'Smoke workspace',
  )
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/omnibar/index.html`)
  for (const surface of [manager, popup])
    await expect(surface.locator('[data-surface]')).toHaveAttribute(
      'data-theme',
      'dark',
    )
  const surfaces = [page, manager, popup]
  for (const theme of ['light', 'dark'] as const) {
    await page
      .getByRole('group', { name: 'Theme mode', exact: true })
      .getByText(theme === 'dark' ? 'Dark' : 'Light', { exact: true })
      .click()
    for (const surface of surfaces)
      await expect(surface.locator('[data-surface]')).toHaveAttribute(
        'data-theme',
        theme,
      )
    for (const preset of ['Reef', 'Matcha']) {
      const before = await palettePaint(page)
      await page.getByRole('button', { name: preset, exact: true }).click()
      const expected = await palettePaint(page)
      expect(expected).not.toEqual(before)
      for (const surface of surfaces)
        await expect.poll(() => palettePaint(surface)).toEqual(expected)
    }
  }

  await expect(
    manager.getByRole('button', { name: 'Appearance', exact: true }),
  ).toHaveCount(0)
  await popup.getByRole('combobox').fill('Smoke workspace')
  await expect(
    popup.getByRole('option', {
      name: /Smoke workspace.*Window/,
    }),
  ).toBeVisible()
  await popup.getByRole('combobox').fill('e')
  await expect(
    popup.getByRole('option').filter({ hasText: /options\/index\.html/ }),
  ).toBeVisible()
  await popup.getByRole('combobox').fill('unfinished search')
  try {
    await popup.keyboard.down('Escape')
  } catch (error) {
    if (!popup.isClosed()) throw error
  }
  await expect.poll(() => popup.isClosed()).toBe(true)
  await page.getByRole('button', { name: 'Rose', exact: true }).click()
  for (const surface of [page, manager])
    await expect
      .poll(() => palettePaint(surface))
      .toEqual(await palettePaint(page))
  const refreshedPopup = await context.newPage()
  await refreshedPopup.goto(
    `chrome-extension://${extensionId}/omnibar/index.html`,
  )
  await expect
    .poll(() => palettePaint(refreshedPopup))
    .toEqual(await palettePaint(page))
  await expect(refreshedPopup.getByRole('combobox')).toHaveValue(
    'unfinished search',
  )
  await refreshedPopup.close()

  const target = await context.newPage()
  await target.goto('data:text/html,<title>Smoke test tab</title>')
  const row = manager.getByRole('option', {
    name: 'Tab: Smoke test tab',
    exact: true,
  })
  await expect(row).toBeVisible()
  const search = await context.newPage()
  await search.goto(`chrome-extension://${extensionId}/omnibar/index.html`)
  await search.getByRole('combobox').fill('Smoke')
  await expect(
    search.getByRole('option', { name: /^Smoke test tab tab/ }),
  ).toBeVisible()
  await search.getByRole('option', { name: /^Smoke test tab tab/ }).click()
  await expect.poll(() => search.isClosed()).toBe(true)
  const recalled = await context.newPage()
  await recalled.goto(`chrome-extension://${extensionId}/omnibar/index.html`)
  await recalled.getByRole('combobox').fill('Smoke')
  await expect(recalled.getByRole('option').nth(1)).toContainText(
    'Smoke test tab',
  )
  await recalled.close()
  await row.click()
  await manager.keyboard.press('Delete')
  await expect(row).toHaveCount(0)
  await expect.poll(() => target.isClosed()).toBe(true)
  const recallServer = createServer((request, response) => {
    if (request.url === '/start') {
      response.writeHead(302, { location: '/workspace' })
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'text/html' })
    response.end(
      `<title>${request.url === '/calendar' ? 'Calendar' : 'Recall project Atlas'}</title>`,
    )
  })
  await new Promise<void>((resolve) =>
    recallServer.listen(0, '127.0.0.1', resolve),
  )
  const recallOrigin = `http://127.0.0.1:${(recallServer.address() as AddressInfo).port}`
  try {
    await page.evaluate(async (url) => {
      await chrome.bookmarks.create({ title: 'Recall project Atlas', url })
    }, `${recallOrigin}/start`)
    const bookmarkSearch = await context.newPage()
    await bookmarkSearch.goto(
      `chrome-extension://${extensionId}/omnibar/index.html`,
    )
    await bookmarkSearch.getByRole('combobox').fill('Recall project Atlas')
    const opening = context.waitForEvent('page')
    await bookmarkSearch
      .getByRole('option', { name: /^Recall project Atlas bookmark/ })
      .click({ modifiers: ['ControlOrMeta'] })
    const opened = await opening
    await opened.waitForURL(`${recallOrigin}/workspace`)
    await expect.poll(() => bookmarkSearch.isClosed()).toBe(true)
    const sourceRecall = await context.newPage()
    await sourceRecall.goto(
      `chrome-extension://${extensionId}/omnibar/index.html`,
    )
    await sourceRecall.getByRole('combobox').fill('proj')
    await expect(sourceRecall.getByRole('option').nth(1)).toContainText(
      'Recall project Atlas',
    )
    await expect(sourceRecall.getByRole('option').nth(1)).toContainText('tab')
    await opened.goto(`${recallOrigin}/calendar`)
    await expect(sourceRecall.getByRole('option').nth(1)).toContainText(
      'bookmark',
    )
    await sourceRecall.close()
    await opened.close()
  } finally {
    await new Promise<void>((resolve) => {
      recallServer.close(() => resolve())
      recallServer.closeAllConnections()
    })
  }

  await page.reload()
  await expect(
    page.getByRole('combobox', { name: 'Window identification' }),
  ).toHaveText('First tab')
  await expect(
    page.getByRole('radio', { name: 'Dark', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('button', { name: 'Rose', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('group', { name: 'Seasonal themes', exact: true }),
  ).toHaveCount(0)
  await page
    .getByRole('button', { name: 'Choose seasonal icons', exact: true })
    .click()
  await expect(
    page.getByRole('group', { name: 'Summer', exact: true }),
  ).toHaveCount(0)
  const holidayIcons = page.getByRole('group', {
    name: 'Halloween',
    exact: true,
  })
  await holidayIcons
    .locator('label')
    .filter({
      has: page.getByRole('radio', { name: 'Vampire fangs', exact: true }),
    })
    .click()
  await expect(
    holidayIcons.getByRole('radio', { name: 'Vampire fangs', exact: true }),
  ).toBeChecked()
  await page.reload()
  await expect(
    holidayIcons.getByRole('radio', { name: 'Vampire fangs', exact: true }),
  ).toBeChecked()
  await page
    .getByRole('button', { name: 'Back to options', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Reset options', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Rose', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => palettePaint(manager))
    .toEqual(await palettePaint(page))
})
