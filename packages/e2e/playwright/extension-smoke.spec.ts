import { expect, test } from './extension-fixtures'

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
  const manager = await context.newPage()
  await manager.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/omnibar/index.html`)
  for (const surface of [manager, popup])
    await expect(surface.locator('[data-surface]')).toHaveAttribute(
      'data-theme',
      'dark',
    )
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
