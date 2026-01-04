import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

/**
 * Selection integration tests for Tab Manager.
 *
 * These tests verify that the selection system works correctly across
 * different interaction patterns: mouse clicks, keyboard navigation,
 * and cross-pane behavior.
 *
 * Data attributes used for selection:
 * - [data-nav-type="window"] - Window rail items
 * - [data-nav-type="tab"] - Tab items
 * - [data-nav-type="group"] - Tab group headers
 * - [data-selected="true/false"] - Selection state
 * - [data-tab-item="<id>"] - Tab ID
 * - [data-nav-id="<id>"] - Window ID
 * - [data-group-id="<id>"] - Group ID
 */

// Helper to open Tab Manager page
const openTabManager = async (page: Page, extensionId: string) => {
  const tabManagerUrl = `chrome-extension://${extensionId}/tab-manager/index.html`
  await page.goto(tabManagerUrl)
  await expect(page).toHaveTitle('Tab Manager')
  // Wait for the UI to be fully loaded
  await page.waitForSelector('[data-nav-type="window"]')
}

// Helper to get all selected items in a pane
const getSelectedItems = async (
  page: Page,
  navType: 'window' | 'tab' | 'group',
) => {
  return page.locator(`[data-nav-type="${navType}"][data-selected="true"]`)
}

// Helper to count selected items
const countSelected = async (
  page: Page,
  navType: 'window' | 'tab' | 'group',
) => {
  return (await getSelectedItems(page, navType)).count()
}

// Helper to get all navigable items in a pane
const getAllItems = async (page: Page, navType: 'window' | 'tab' | 'group') => {
  return page.locator(`[data-nav-type="${navType}"]`)
}

test.describe('Tab Manager Selection', () => {
  test.describe('Basic Click Selection', () => {
    test('clicking a tab selects it', async ({ page, extensionId }) => {
      await openTabManager(page, extensionId)

      // Find a tab and click it
      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount > 0) {
        const firstTab = tabs.first()
        await firstTab.click()

        // Verify it's selected
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Verify only one tab is selected
        expect(await countSelected(page, 'tab')).toBe(1)
      }
    })

    test('clicking a different tab deselects the previous one', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 2) {
        const firstTab = tabs.first()
        const secondTab = tabs.nth(1)

        // Click first tab
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Click second tab
        await secondTab.click()

        // First should be deselected, second selected
        await expect(firstTab).toHaveAttribute('data-selected', 'false')
        await expect(secondTab).toHaveAttribute('data-selected', 'true')
        expect(await countSelected(page, 'tab')).toBe(1)
      }
    })

    test('clicking a window selects it', async ({ page, extensionId }) => {
      await openTabManager(page, extensionId)

      const windows = await getAllItems(page, 'window')
      const windowCount = await windows.count()

      if (windowCount > 0) {
        const firstWindow = windows.first()
        await firstWindow.click()

        await expect(firstWindow).toHaveAttribute('data-selected', 'true')
        expect(await countSelected(page, 'window')).toBe(1)
      }
    })
  })

  test.describe('Cmd/Ctrl+Click Multi-Selection', () => {
    test('Cmd+click adds to selection', async ({ page, extensionId }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 2) {
        const firstTab = tabs.first()
        const secondTab = tabs.nth(1)

        // Click first tab
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Cmd+click second tab
        await secondTab.click({ modifiers: ['Meta'] })

        // Both should be selected
        await expect(firstTab).toHaveAttribute('data-selected', 'true')
        await expect(secondTab).toHaveAttribute('data-selected', 'true')
        expect(await countSelected(page, 'tab')).toBe(2)
      }
    })

    test('Cmd+click on selected item deselects it', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 2) {
        const firstTab = tabs.first()
        const secondTab = tabs.nth(1)

        // Select both tabs
        await firstTab.click()
        await secondTab.click({ modifiers: ['Meta'] })
        expect(await countSelected(page, 'tab')).toBe(2)

        // Cmd+click first tab to deselect
        await firstTab.click({ modifiers: ['Meta'] })

        // Only second should be selected
        await expect(firstTab).toHaveAttribute('data-selected', 'false')
        await expect(secondTab).toHaveAttribute('data-selected', 'true')
        expect(await countSelected(page, 'tab')).toBe(1)
      }
    })

    test('Cmd+click can deselect all items (empty selection)', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 1) {
        const firstTab = tabs.first()

        // Select one tab
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Cmd+click to deselect
        await firstTab.click({ modifiers: ['Meta'] })

        // Should have zero selected
        await expect(firstTab).toHaveAttribute('data-selected', 'false')
        expect(await countSelected(page, 'tab')).toBe(0)
      }
    })
  })

  test.describe('Shift+Click Range Selection', () => {
    test('Shift+click selects range of tabs', async ({ page, extensionId }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 3) {
        const firstTab = tabs.first()
        const thirdTab = tabs.nth(2)

        // Click first tab to set anchor
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Shift+click third tab
        await thirdTab.click({ modifiers: ['Shift'] })

        // All three should be selected
        expect(await countSelected(page, 'tab')).toBe(3)
        await expect(firstTab).toHaveAttribute('data-selected', 'true')
        await expect(tabs.nth(1)).toHaveAttribute('data-selected', 'true')
        await expect(thirdTab).toHaveAttribute('data-selected', 'true')
      }
    })

    test('Shift+click contracts range when clicking closer to anchor', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 4) {
        const firstTab = tabs.first()
        const secondTab = tabs.nth(1)
        const fourthTab = tabs.nth(3)

        // Click first tab to set anchor
        await firstTab.click()

        // Shift+click fourth tab (select 1-4)
        await fourthTab.click({ modifiers: ['Shift'] })
        expect(await countSelected(page, 'tab')).toBe(4)

        // Shift+click second tab (contract to 1-2)
        await secondTab.click({ modifiers: ['Shift'] })

        // Only first two should be selected
        expect(await countSelected(page, 'tab')).toBe(2)
        await expect(firstTab).toHaveAttribute('data-selected', 'true')
        await expect(secondTab).toHaveAttribute('data-selected', 'true')
        await expect(tabs.nth(2)).toHaveAttribute('data-selected', 'false')
        await expect(fourthTab).toHaveAttribute('data-selected', 'false')
      }
    })
  })

  test.describe('Cross-Pane Behavior', () => {
    test('clicking in tab pane clears window pane selection', async ({
      page,
      extensionId,
      context,
    }) => {
      // Create an additional window to have multiple windows
      await context.newPage()

      await openTabManager(page, extensionId)

      // Wait for windows to be loaded
      await page.waitForSelector('[data-nav-type="window"]')

      const windows = await getAllItems(page, 'window')
      const windowCount = await windows.count()

      if (windowCount >= 2) {
        const firstWindow = windows.first()
        const secondWindow = windows.nth(1)

        // Select multiple windows with Cmd+click
        await firstWindow.click()
        await secondWindow.click({ modifiers: ['Meta'] })
        expect(await countSelected(page, 'window')).toBe(2)

        // Cmd+click a tab in the tab pane (cross-pane Cmd+click)
        // This specifically tests cross-pane clearing with modifier keys
        const tabs = await getAllItems(page, 'tab')
        if ((await tabs.count()) > 0) {
          await tabs.first().click({ modifiers: ['Meta'] })

          // Windows should be deselected (cross-pane click clears selection)
          // Only the tab should be selected
          expect(await countSelected(page, 'window')).toBe(0)
          expect(await countSelected(page, 'tab')).toBe(1)
        }
      }
    })

    test('clicking in window pane clears tab pane selection', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)
      await page.waitForSelector('[data-nav-type="window"]')

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 2) {
        // Select multiple tabs with Cmd+click
        await tabs.first().click()
        await tabs.nth(1).click({ modifiers: ['Meta'] })
        expect(await countSelected(page, 'tab')).toBe(2)

        // Click a window in the window pane
        const windows = await getAllItems(page, 'window')
        if ((await windows.count()) > 0) {
          await windows.first().click()

          // Tabs should be deselected (cross-pane clears selection)
          expect(await countSelected(page, 'tab')).toBe(0)
        }
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('Space bar toggles selection in multi-select mode', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount > 0) {
        const firstTab = tabs.first()
        // Click to focus and select (this is how users normally interact)
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Navigate to second tab with arrow (this puts focus on nav items)
        await page.keyboard.press('ArrowDown')
        const secondTab = tabs.nth(1)

        // Press Space to enter multi-select mode and toggle selection
        await page.keyboard.press('Space')

        // Both should now be selected (first from click, second from space)
        await expect(secondTab).toHaveAttribute('data-selected', 'true')

        // Press Space again to deselect second tab (stays in multi-select mode)
        await page.keyboard.press('Space')

        // Second should be deselected, first still selected
        await expect(secondTab).toHaveAttribute('data-selected', 'false')
      }
    })

    test('Escape clears selection', async ({ page, extensionId }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 2) {
        // Select multiple tabs
        await tabs.first().click()
        await tabs.nth(1).click({ modifiers: ['Meta'] })
        expect(await countSelected(page, 'tab')).toBe(2)

        // Press Escape
        await page.keyboard.press('Escape')

        // Selection should be cleared (but focused item selected in default mode)
        // Escape clears all, then selects focused item
        expect(await countSelected(page, 'tab')).toBeLessThanOrEqual(1)
      }
    })

    test('Arrow keys navigate and select in default mode', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 2) {
        const firstTab = tabs.first()

        // Click first tab to focus and select
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Press ArrowDown to move to next tab
        await page.keyboard.press('ArrowDown')

        // First tab should be deselected, second selected
        // (in default mode, arrow keys move selection)
        await expect(firstTab).toHaveAttribute('data-selected', 'false')
        await expect(tabs.nth(1)).toHaveAttribute('data-selected', 'true')
      }
    })

    test('Shift+Arrow extends selection range', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 3) {
        const firstTab = tabs.first()

        // Click first tab
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')
        expect(await countSelected(page, 'tab')).toBe(1)

        // Shift+ArrowDown twice
        await page.keyboard.press('Shift+ArrowDown')
        await page.keyboard.press('Shift+ArrowDown')

        // Should have 3 tabs selected
        expect(await countSelected(page, 'tab')).toBe(3)
      }
    })
  })

  test.describe('Mode Transitions', () => {
    test('mouse click after keyboard multi-select exits multi-select mode', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount >= 3) {
        const firstTab = tabs.first()
        const secondTab = tabs.nth(1)
        const thirdTab = tabs.nth(2)

        // Click first tab to focus and select
        await firstTab.click()
        await expect(firstTab).toHaveAttribute('data-selected', 'true')

        // Navigate to second tab with arrow
        await page.keyboard.press('ArrowDown')

        // Enter multi-select mode and select second tab
        await page.keyboard.press('Space')

        // Should have 2 selected (first from click, second from space)
        expect(await countSelected(page, 'tab')).toBe(2)
        await expect(firstTab).toHaveAttribute('data-selected', 'true')
        await expect(secondTab).toHaveAttribute('data-selected', 'true')

        // Regular click on third tab should exit multi-select and select only clicked item
        await thirdTab.click()

        // Should have only 1 selected (the clicked one)
        expect(await countSelected(page, 'tab')).toBe(1)
        await expect(thirdTab).toHaveAttribute('data-selected', 'true')
        await expect(firstTab).toHaveAttribute('data-selected', 'false')
        await expect(secondTab).toHaveAttribute('data-selected', 'false')
      }
    })
  })

  test.describe('Select All (Cmd+A)', () => {
    test('Cmd+A selects all tabs in current window', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      const tabCount = await tabs.count()

      if (tabCount > 0) {
        // Focus a tab first
        await tabs.first().click()

        // Press Cmd+A
        await page.keyboard.press('Meta+a')

        // All tabs should be selected
        expect(await countSelected(page, 'tab')).toBe(tabCount)
      }
    })
  })
})
