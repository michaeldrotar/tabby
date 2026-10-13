import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

const dismissNotifications = async (page: Page) => {
  const dismiss = page
    .locator('[data-notification-status]')
    .getByRole('button', { name: 'Dismiss notification' })
    .first()
  while (await dismiss.isVisible()) {
    const cards = page.locator('[data-notification-card]')
    const count = await cards.count()
    await dismiss.click()
    await expect(cards).toHaveCount(count - 1)
  }
}

const openActionMenu = async (page: Page) => {
  await dismissNotifications(page)
  await page.getByRole('button', { name: 'More actions' }).click()
  return page.locator('[data-action-bar-menu]')
}

test('organizes a tab selection into a group, moves it and closes its window using fixture data', async ({
  page,
}) => {
  await page.goto('/tab-manager/index.html')
  await page.getByRole('button', { name: 'Expand sidebar' }).click()
  const tabs = page.locator('[data-nav-type="tab"]')
  const windows = page.locator('[data-nav-type="window"]')
  const groups = page.locator('[data-nav-type="group"]')
  const selectedTabs = page.locator(
    '[data-nav-type="tab"][data-selected="true"]',
  )
  const summary = page.locator('[data-selection-summary]')
  const first = page.getByRole('option', {
    name: /^Tab: Project notes(?: \(pinned\))?$/,
  })
  const second = page.getByRole('option', {
    name: /^Tab: Tabby · Pull requests(?: \(pinned\))?$/,
  })

  await expect(tabs).toHaveCount(4)
  await first.click()
  await tabs.last().click({ modifiers: ['Shift'] })
  await expect(selectedTabs).toHaveCount(4)
  await expect(summary).toHaveAttribute('data-selected-tabs', '4')
  await first.click()
  await page.keyboard.press('Shift+ArrowDown')
  await expect(selectedTabs).toHaveCount(2)
  await page.keyboard.press('ControlOrMeta+a')
  await expect(selectedTabs).toHaveCount(4)
  await page.keyboard.press('Escape')
  await expect(selectedTabs).toHaveCount(1)
  await first.click({ button: 'right' })
  await expect(page.locator('[data-action-bar-menu]')).toBeVisible()
  await page.keyboard.press('Escape')
  await second.click({ modifiers: ['ControlOrMeta'] })
  await expect(selectedTabs).toHaveCount(2)
  await expect(summary).toHaveAttribute('data-selected-tabs', '2')

  let menu = await openActionMenu(page)
  for (const name of [
    'Close 2 tabs',
    'Move 2 tabs to window',
    'Group 2 tabs',
    'Pin 2 tabs',
    'Duplicate 2 tabs',
    'Reload 2 tabs',
    'Copy 2 tabs',
  ])
    await expect(menu.getByRole('menuitem', { name })).toBeVisible()
  await menu.getByRole('menuitem', { name: 'Pin 2 tabs' }).click()
  await expect(first).toHaveAccessibleName('Tab: Project notes (pinned)')
  await expect(second).toHaveAccessibleName(
    'Tab: Tabby · Pull requests (pinned)',
  )
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Unpin 2 tabs' }).click()
  await expect(first).toHaveAccessibleName('Tab: Project notes')

  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Group 2 tabs' }).click()
  await page.getByRole('menuitem', { name: /New Group.*2/ }).click()
  await expect(groups).toHaveCount(1)
  await groups.first().locator('button').first().click()
  await expect(summary).toHaveAttribute('data-selected-groups', '1')
  await expect(summary).toHaveAttribute('data-selected-tabs', '2')
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Rename Group' }).click()
  const rename = groups.first().getByRole('textbox')
  await expect(rename).toBeFocused()
  await rename.fill('Project group')
  await rename.press('Enter')
  await expect(groups).toContainText('Project group')
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Change Color' }).click()
  await page.getByRole('menuitem', { name: 'Blue' }).click()
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Collapse Group' }).click()
  await expect(groups).toHaveAttribute('data-collapsed', 'true')
  await expect(tabs).toHaveCount(2)
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Expand Group' }).click()
  await expect(tabs).toHaveCount(4)
  await page.getByRole('button', { name: 'New tab in Project group' }).click()
  await expect(tabs).toHaveCount(5)

  await page.getByRole('button', { name: 'New window' }).click()
  await expect(windows).toHaveCount(2)
  const source = windows.first()
  const destination = windows.last()
  await expect(destination).toHaveAttribute('data-viewing', 'true')
  await source.click()
  await first.click()
  await second.click({ modifiers: ['ControlOrMeta'] })
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Move 2 tabs to window' }).click()
  await page
    .locator('[data-action-bar-panel]')
    .getByRole('menuitem', { name: 'New Tab · 2' })
    .click()
  await expect(page.locator('[data-notification-card]')).toHaveCount(0)
  await expect(destination).toHaveAttribute('data-viewing', 'true')
  await source.click()
  await expect(first).toHaveCount(0)
  await expect(second).toHaveCount(0)
  await destination.click({ modifiers: ['ControlOrMeta'] })
  await expect(summary).toHaveAttribute('data-selected-windows', '2')
  await expect(summary).toHaveAttribute('data-selected-tabs', '6')
  menu = await openActionMenu(page)
  await expect(
    menu.getByRole('menuitem', { name: 'Group 6 tabs' }),
  ).toBeDisabled()
  await page.keyboard.press('Escape')

  await destination.click()
  await expect(first).toBeVisible()
  await expect(second).toBeVisible()
  await first.click()
  await second.click({ modifiers: ['ControlOrMeta'] })
  menu = await openActionMenu(page)
  await menu.getByRole('menuitem', { name: 'Close 2 tabs' }).click()
  await expect(first).toHaveCount(0)
  await expect(second).toHaveCount(0)
  await expect(page.locator('[data-notification-card]')).toHaveCount(0)
  await destination.click()
  await page.keyboard.press('Backspace')
  await expect(windows).toHaveCount(1)
  await expect(tabs).toHaveCount(3)
})
