import { expect, test } from './fixtures'

test('Options persists appearance and shares updates with the popup and Tab Manager', async ({
  page,
  context,
  extensionId,
}) => {
  const worker = context.serviceWorkers()[0]!
  await worker.evaluate(async () => {
    await chrome.storage.local.remove('preference-storage-key')
  })
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
  await popup.close()
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
  await refreshedPopup.close()
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
  await expect
    .poll(() =>
      worker.evaluate(
        async () =>
          (await chrome.storage.local.get('preference-storage-key'))[
            'preference-storage-key'
          ],
      ),
    )
    .toBeUndefined()
})
