import { expect, test } from './fixtures'

test('navigates and activates empty search actions with the keyboard', async ({
  page,
}) => {
  await page.goto('/omnibar/index.html?originalWindowId=1')
  await page.evaluate(() => {
    window.close = () => undefined
    chrome.sidePanel.open = async () => {
      await chrome.storage.session.set({ openedTabManager: true })
    }
    chrome.runtime.openOptionsPage = async () => {
      await chrome.storage.session.set({ openedOptions: true })
    }
  })
  const input = page.getByRole('combobox')
  const manager = page.getByRole('option', { name: 'Open tab manager' })
  const options = page.getByRole('option', { name: 'Open options' })
  await expect(input).toBeFocused()
  await expect(manager).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowDown')
  await expect(options).toHaveAttribute('aria-selected', 'true')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute(
    'aria-activedescendant',
    await options.getAttribute('id'),
  )
  await page.keyboard.press('ArrowDown')
  await expect(options).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowUp')
  await expect(manager).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowUp')
  await expect(manager).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect
    .poll(() =>
      page.evaluate(() => chrome.storage.session.get('openedOptions')),
    )
    .toEqual({ openedOptions: true })
  await expect(input).toBeFocused()
  await page.keyboard.type('project')
  await expect(input).toHaveValue('project')
  const results = page.getByRole('option')
  await expect(results.first()).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowDown')
  await expect(input).toBeFocused()
  await expect(results.nth(1)).toHaveAttribute('aria-selected', 'true')
  await input.fill('')
  await page.keyboard.press('ArrowDown')
  await expect(options).toHaveAttribute('aria-selected', 'true')
  await expect(input).toBeFocused()
  await page.keyboard.type('tab')
  await expect(input).toHaveValue('tab')
  await expect(results.first()).toHaveAttribute('aria-selected', 'true')
  await input.fill('')
  await options.hover()
  await expect(options).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowUp')
  await expect(manager).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Enter')
  await expect
    .poll(() =>
      page.evaluate(() => chrome.storage.session.get('openedTabManager')),
    )
    .toEqual({ openedTabManager: true })
})
