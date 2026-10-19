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
  const background = page.getByRole('combobox', {
    name: 'Background',
    exact: true,
  })
  await background.click()
  for (const palette of ['mist', 'mauve', 'olive', 'taupe']) {
    const swatch = page.getByRole('option', { name: palette, exact: true })
    const paint = await swatch
      .locator('[aria-hidden="true"]')
      .evaluate((node) => getComputedStyle(node).backgroundColor)
    expect(paint).not.toBe('rgba(0, 0, 0, 0)')
    expect(paint).not.toBe('transparent')
  }
  await page.keyboard.press('Escape')
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
    for (const [label, palette, token] of [
      ['Background', theme === 'dark' ? 'mist' : 'taupe', 'background'],
      ['Foreground', theme === 'dark' ? 'olive' : 'mauve', 'foreground'],
      ['Accent', theme === 'dark' ? 'rose' : 'teal', 'accent'],
    ] as const) {
      const before = await Promise.all(surfaces.map(palettePaint))
      await page.getByRole('combobox', { name: label, exact: true }).click()
      await page.getByRole('option', { name: palette, exact: true }).click()
      const expected = await palettePaint(page)
      for (const [index, surface] of surfaces.entries()) {
        await expect.poll(() => palettePaint(surface)).toEqual(expected)
        expect(expected[token]).not.toBe(before[index]![token])
      }
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
  await popup.getByRole('combobox').fill('unfinished search')
  await popup.keyboard.down('Escape')
  await expect.poll(() => popup.isClosed()).toBe(true)
  await page
    .getByRole('group', { name: 'Accent', exact: true })
    .getByRole('combobox')
    .click()
  await page.getByRole('option', { name: 'rose', exact: true }).click()
  for (const surface of [page, manager])
    await expect(surface.locator('[data-surface]')).toHaveAttribute(
      'data-theme-accent',
      'rose',
    )
  const refreshedPopup = await context.newPage()
  await refreshedPopup.goto(
    `chrome-extension://${extensionId}/omnibar/index.html`,
  )
  await expect(refreshedPopup.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'rose',
  )
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
  await expect(page.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'rose',
  )
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
  await expect(manager.locator('[data-surface]')).toHaveAttribute(
    'data-theme-accent',
    'amber',
  )
})
