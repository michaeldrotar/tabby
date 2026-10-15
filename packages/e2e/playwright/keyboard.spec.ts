import { expect, test } from './fixtures'

test.describe.configure({ timeout: 60_000 })

test('keyboard navigation crosses sections, creates items and acts on the selection', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  const windows = page.locator('[data-nav-type="window"]')
  const tabs = page.getByRole('option')
  const newWindow = page.getByRole('button', {
    name: 'New window',
    exact: true,
  })
  const newTab = page.getByRole('button', { name: 'New tab', exact: true })
  const tools = page.getByRole('button', { name: 'Search everything' })
  await expect(
    page.getByRole('button', { name: 'Scroll to active' }),
  ).toHaveCount(0)
  const actions = page.getByRole('button', { name: 'More actions' })
  const sidebar = page.getByRole('button', { name: 'Expand sidebar' })
  await expect(windows.first()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(tools).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(windows.first()).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(sidebar).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(windows.first()).toBeFocused()
  await page.keyboard.press('End')
  await expect(newWindow).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(windows.last()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(newWindow).toBeFocused()
  const initialWindows = await windows.count()
  await page.keyboard.press('Space')
  await expect(windows).toHaveCount(initialWindows + 1)
  await expect(windows.last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(tools).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('button', { name: 'Settings', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(tabs.first()).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(tools).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(tabs.first()).toBeFocused()
  const initialTabs = await tabs.count()
  await page.keyboard.press('End')
  await expect(newTab).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(tabs.last()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(newTab).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(tabs).toHaveCount(initialTabs + 1)
  await expect(tabs.last()).toBeFocused()
  await page.keyboard.press('End')
  await page.keyboard.press('Space')
  await expect(tabs).toHaveCount(initialTabs + 2)
  await expect(tabs.last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(actions).toBeFocused()
  await expect(page.locator('[data-notification-card]')).toHaveCount(0)
  await page.keyboard.press('Enter')
  await page.keyboard.press('End')
  await expect(
    page.getByRole('menuitem', { name: 'Keyboard shortcuts' }),
  ).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(actions).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(tabs.last()).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('Shift+ArrowDown')
  await expect(page.locator('[data-selection-summary]')).toHaveAttribute(
    'data-selected-tabs',
    '2',
  )
  await page.keyboard.press('Shift+Enter')
  const close = page.getByRole('menuitem', {
    name: 'Close 2 tabs',
    exact: true,
  })
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(actions).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(tabs.nth(1)).toBeFocused()
  await page.keyboard.press('Delete')
  await expect(tabs).toHaveCount(initialTabs)
  await expect(page.locator('[data-selection-summary]')).toHaveAttribute(
    'data-selected-tabs',
    '0',
  )
})
