import { expect, test } from './fixtures'

test('provider composition manages real tabs and windows with saved appearance', async ({
  page,
  context,
  extensionId,
}) => {
  const worker = context.serviceWorkers()[0]!
  await worker.evaluate(async () => {
    const existing = await chrome.storage.local.get('preference-storage-key')
    await chrome.storage.local.set({
      'preference-storage-key': {
        ...existing['preference-storage-key'],
        theme: 'dark',
        themeDarkAccent: 'rose',
        themeDarkBackground: 'slate',
        themeDarkForeground: 'stone',
        themeDarkAccentStrength: 25,
      },
    })
  })
  const target = await context.newPage()
  await target.goto('data:text/html,<title>Provider test tab</title>')
  await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
  const surface = page.locator('[data-surface="extension-tab-manager"]')
  await expect(surface).toBeVisible()
  await expect
    .poll(() =>
      surface.evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(await page.evaluate(() => innerHeight))
  await expect(surface).toHaveAttribute('data-theme', 'dark')
  await expect(surface).toHaveAttribute('data-theme-accent', 'rose')
  await expect(surface).toHaveAttribute('data-theme-background', 'slate')
  await expect(surface).toHaveAttribute('data-theme-foreground', 'stone')
  await expect
    .poll(() =>
      surface.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--accent-strength'),
      ),
    )
    .toBe('25')
  const row = page.getByRole('option', {
    name: 'Tab: Provider test tab',
    exact: true,
  })
  await expect(row).toBeVisible()
  await row.click()
  await expect
    .poll(() =>
      worker.evaluate(
        async () =>
          (await chrome.tabs.query({})).find(
            (tab) => tab.title === 'Provider test tab',
          )?.active,
      ),
    )
    .toBe(true)
  await page.keyboard.press('Delete')
  await expect(row).toHaveCount(0)
  await expect.poll(() => target.isClosed()).toBe(true)
  const initialWindows = await worker.evaluate(
    async () =>
      (await chrome.windows.getAll({ windowTypes: ['normal'] })).length,
  )
  await page.getByRole('button', { name: 'New Window', exact: true }).click()
  await expect
    .poll(async () =>
      worker.evaluate(
        async () =>
          (await chrome.windows.getAll({ windowTypes: ['normal'] })).length,
      ),
    )
    .toBe(initialWindows + 1)
  await expect(
    page.getByRole('option', { name: /Tab: (New Tab|newtab)/ }),
  ).toBeVisible()
  await page.reload()
  await expect(surface).toHaveAttribute('data-theme-accent', 'rose')
})
