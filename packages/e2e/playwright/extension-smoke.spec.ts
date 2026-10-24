import { expect, test } from './extension-fixtures'
import type { Page } from '@playwright/test'

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
  await popup.keyboard.down('Escape')
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
  await expect(search.getByRole('option').nth(1)).toContainText(
    'Smoke test tab',
  )
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
  const summerIcons = page.getByRole('group', { name: 'Summer', exact: true })
  await summerIcons
    .locator('label')
    .filter({ has: page.getByRole('radio', { name: 'Snorkel', exact: true }) })
    .click()
  await expect(
    summerIcons.getByRole('radio', { name: 'Snorkel', exact: true }),
  ).toBeChecked()
  await page.reload()
  await expect(
    summerIcons.getByRole('radio', { name: 'Snorkel', exact: true }),
  ).toBeChecked()
  await page
    .getByRole('button', { name: 'Back to settings', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Reset preferences', exact: true })
    .click()
  await expect(
    page.getByRole('radio', { name: 'System', exact: true }),
  ).toBeChecked()
  await expect(page.locator('[data-surface]')).toHaveAttribute(
    'data-theme',
    'light',
  )
  await expect(
    page.getByRole('button', { name: 'Porcelain', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => palettePaint(manager))
    .toEqual(await palettePaint(page))
})
