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

const openActionMenu = async (page: Page) => {
  const notifications = page.locator('[data-sonner-toast]')
  const notification = page
    .locator('[data-sonner-toast][data-front="true"]')
    .getByRole('button', { name: 'Dismiss notification' })
  while (await notification.isVisible()) {
    const count = await notifications.count()
    await notification.click()
    await expect(notifications).toHaveCount(count - 1)
  }
  await page.getByRole('button', { name: 'More actions' }).click()
  return page.locator('[data-action-bar-menu]')
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

test.describe('Creation Actions', () => {
  test('creates focused tabs at the end of a window or inside a group', async ({
    page,
    extensionId,
  }) => {
    await openTabManager(page, extensionId)

    const setup = await page.evaluate(async () => {
      const currentWindow = await chrome.windows.getCurrent()
      if (currentWindow.id === undefined) {
        throw new Error('The current window was not available.')
      }

      const firstTab = await chrome.tabs.create({
        windowId: currentWindow.id,
        active: false,
        url: 'data:text/html,%3Ctitle%3ECreation%20Group%20One%3C/title%3E',
      })
      const secondTab = await chrome.tabs.create({
        windowId: currentWindow.id,
        active: false,
        url: 'data:text/html,%3Ctitle%3ECreation%20Group%20Two%3C/title%3E',
      })
      if (firstTab.id === undefined || secondTab.id === undefined) {
        throw new Error('The group test tabs were not created.')
      }

      const groupId = await chrome.tabs.group({
        tabIds: [firstTab.id, secondTab.id],
      })
      await chrome.tabGroups.update(groupId, { title: 'Creation Test Group' })

      const tabs = await chrome.tabs.query({ windowId: currentWindow.id })
      const groupTabs = tabs.filter((tab) => tab.groupId === groupId)
      return {
        windowId: currentWindow.id,
        groupId,
        existingTabIds: tabs.flatMap((tab) =>
          tab.id === undefined ? [] : [tab.id],
        ),
        groupLastIndex: groupTabs.at(-1)?.index ?? -1,
        tabCount: tabs.length,
      }
    })

    const newTabButton = page.getByRole('button', {
      name: 'New Tab',
      exact: true,
    })
    await newTabButton.focus()
    await page.keyboard.press('Space')

    await expect
      .poll(() =>
        page.evaluate(
          async (windowId) => (await chrome.tabs.query({ windowId })).length,
          setup.windowId,
        ),
      )
      .toBe(setup.tabCount + 1)

    const standaloneTab = await page.evaluate(
      async ({ windowId, existingTabIds }) => {
        const tabs = await chrome.tabs.query({ windowId })
        const tab = tabs.find(
          (candidate) =>
            candidate.id !== undefined &&
            !existingTabIds.includes(candidate.id),
        )
        if (tab?.id === undefined) {
          throw new Error('The new standalone tab was not found.')
        }
        return {
          id: tab.id,
          index: tab.index,
          active: tab.active,
          groupId: tab.groupId,
          lastTabId: tabs.at(-1)?.id,
          windowFocused: (await chrome.windows.get(windowId)).focused,
        }
      },
      setup,
    )
    expect(standaloneTab.index).toBe(setup.tabCount)
    expect(standaloneTab.lastTabId).toBe(standaloneTab.id)
    expect(standaloneTab.active).toBe(true)
    expect(standaloneTab.groupId).toBe(-1)
    expect(standaloneTab.windowFocused).toBe(true)

    await page.bringToFront()
    await page
      .getByRole('button', { name: 'New Tab in Creation Test Group' })
      .click()

    const groupedTab = await page.evaluate(async ({ windowId, groupId }) => {
      const groupTabs = (await chrome.tabs.query({ windowId })).filter(
        (tab) => tab.groupId === groupId,
      )
      const tab = groupTabs.at(-1)
      if (tab?.id === undefined) {
        throw new Error('The new group tab was not found.')
      }
      return {
        id: tab.id,
        index: tab.index,
        active: tab.active,
        groupId: tab.groupId,
        groupTabCount: groupTabs.length,
        windowFocused: (await chrome.windows.get(windowId)).focused,
      }
    }, setup)
    expect(groupedTab.groupId).toBe(setup.groupId)
    expect(groupedTab.groupTabCount).toBe(3)
    expect(groupedTab.index).toBe(setup.groupLastIndex + 1)
    expect(groupedTab.active).toBe(true)
    expect(groupedTab.windowFocused).toBe(true)
  })

  test('creates and focuses a new window after the existing windows', async ({
    page,
    extensionId,
  }) => {
    await openTabManager(page, extensionId)

    const existingWindowIds = await page.evaluate(async () =>
      (await chrome.windows.getAll({ populate: false })).flatMap((window) =>
        window.id === undefined ? [] : [window.id],
      ),
    )
    const newWindowButton = page.getByRole('button', {
      name: 'New Window',
      exact: true,
    })
    await newWindowButton.focus()
    await page.keyboard.press('Enter')

    const windowRows = await getAllItems(page, 'window')
    await expect(windowRows).toHaveCount(existingWindowIds.length + 1)

    const newWindow = await page.evaluate(async (previousIds) => {
      const windows = await chrome.windows.getAll({ populate: false })
      const createdWindow = windows.find(
        (window) => window.id !== undefined && !previousIds.includes(window.id),
      )
      if (createdWindow?.id === undefined) {
        throw new Error('The new window was not found.')
      }
      const focusedWindow = await chrome.windows.getLastFocused()
      return {
        id: createdWindow.id,
        focused: createdWindow.focused,
        lastFocusedId: focusedWindow.id,
      }
    }, existingWindowIds)

    expect(newWindow.focused).toBe(true)
    expect(newWindow.lastFocusedId).toBe(newWindow.id)
    expect(await windowRows.last().getAttribute('data-nav-id')).toBe(
      String(newWindow.id),
    )
  })
})

test.describe('Tab Manager Selection', () => {
  test.describe('Basic Click Selection', () => {
    test('first sidebar open selects the current window and its active tab', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const activeWindow = page.locator(
        '[data-nav-type="window"][data-active="true"]',
      )
      const summary = page.locator('[data-selection-summary]').first()
      await expect(activeWindow).toHaveAttribute('data-selected', 'true')
      await expect(summary).toHaveAttribute('data-selected-windows', '1')
      await expect(summary).toHaveAttribute('data-selected-tabs', '1')
      expect(
        (await summary.locator(':scope > span').allTextContents()).map(
          (count) => count.trim(),
        ),
      ).toEqual(['1', '0', '1'])
      await expect(summary).not.toContainText(/tabs/i)
    })

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

    test('plain window click selects that window and only its active tab', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const windows = await getAllItems(page, 'window')
      const windowCount = await windows.count()

      if (windowCount > 0) {
        const firstWindow = windows.first()
        await firstWindow.click()

        await expect(firstWindow).toHaveAttribute('data-selected', 'true')
        expect(await countSelected(page, 'window')).toBe(1)
        await expect(
          page.locator('[data-selection-summary]').first(),
        ).toHaveAttribute('data-selected-tabs', '1')
      }
    })

    test('right-click selects unselected rows and opens the shared action menu', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const tabs = await getAllItems(page, 'tab')
      expect(await tabs.count()).toBeGreaterThan(1)
      const firstTab = tabs.first()
      const secondTab = tabs.nth(1)
      await firstTab.click()
      await secondTab.click({ button: 'right' })

      const menu = page.locator('[data-action-bar-menu]')
      await expect(menu).toBeVisible()
      await expect(secondTab).toHaveAttribute('data-selected', 'true')
      await expect(firstTab).toHaveAttribute('data-selected', 'false')
      await expect(page.locator('[data-radix-menu-content]')).toHaveCount(0)
      await expect(menu.locator('[data-selection-summary]')).toHaveCount(0)
      await expect(menu.getByLabel('Selected items')).toHaveCount(0)
      await page.keyboard.press('Escape')

      await firstTab.click({ modifiers: ['Meta'] })
      await secondTab.click({ button: 'right' })
      await expect(page.locator('[data-action-bar-menu]')).toBeVisible()
      await expect(firstTab).toHaveAttribute('data-selected', 'true')
      await expect(secondTab).toHaveAttribute('data-selected', 'true')

      const firstWindow = (await getAllItems(page, 'window')).first()
      await firstWindow.click({ button: 'right' })
      await expect(page.locator('[data-action-bar-menu]')).toBeVisible()
      await expect(page.locator('[data-radix-menu-content]')).toHaveCount(0)
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
    test('modified window clicks expand every selected window to its tabs', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      // Add a second tab to the current window so full-window selection differs
      // observably from selecting only its active tab.
      await page.evaluate(async () => {
        const currentWindow = await chrome.windows.getCurrent()
        if (currentWindow.id !== undefined) {
          await chrome.tabs.create({
            windowId: currentWindow.id,
            active: false,
          })
        }
      })

      await page.getByRole('button', { name: /New Window/ }).click()
      await page.getByRole('button', { name: /New Window/ }).click()

      // Wait for windows to be loaded
      const windows = await getAllItems(page, 'window')
      await expect(windows).toHaveCount(3)
      const allTabCount = await page.evaluate(
        async () => (await chrome.tabs.query({})).length,
      )

      const firstWindow = windows.first()
      const secondWindow = windows.nth(1)
      const thirdWindow = windows.nth(2)
      await firstWindow.click()
      await expect(
        page.locator('[data-selection-summary]').first(),
      ).toHaveAttribute('data-selected-tabs', '1')
      await secondWindow.click({ modifiers: ['Meta'] })
      await thirdWindow.click({ modifiers: ['Meta'] })

      expect(await countSelected(page, 'window')).toBe(3)
      await expect(
        page.locator('[data-selection-summary]').first(),
      ).toHaveAttribute('data-selected-tabs', String(allTabCount))
      const menu = await openActionMenu(page)
      await expect(
        menu.getByRole('button', { name: `Reload ${allTabCount} tabs` }),
      ).toHaveCount(1)
      await expect(
        menu.getByRole('button', { name: `Copy ${allTabCount} tabs` }),
      ).toHaveCount(1)
      await expect(
        menu.getByRole('button', { name: /Window actions/ }),
      ).toHaveCount(0)
      const groupAction = menu.getByRole('button', { name: /Group .* tabs/ })
      await expect(groupAction).toBeDisabled()
      await expect(groupAction).toHaveAttribute('title', /same window/)
      await expect(groupAction).not.toContainText(/same window/)
    })

    test('right-clicking a selected window expands its menu targets to every tab', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = [
        'Window Batch Ungrouped',
        'Window Batch Group Two One',
        'Window Batch Group Two Two',
        'Window Batch Group Three One',
        'Window Batch Group Three Two',
        'Window Batch Group Three Three',
      ]
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )

      await openTabManager(page, extensionId)
      await page.evaluate(
        async (groupTitles: string[][]) => {
          const tabs = await chrome.tabs.query({ currentWindow: true })
          const findId = (title: string) => {
            const id = tabs.find((tab) => tab.title === title)?.id
            if (id === undefined) throw new Error(`Missing tab: ${title}`)
            return id
          }
          const groupIds = await Promise.all(
            groupTitles.map((group) =>
              chrome.tabs.group({ tabIds: group.map(findId) }),
            ),
          )
          await Promise.all(
            groupIds.map((groupId, index) =>
              chrome.tabGroups.update(groupId, {
                title: `Window Batch Group ${index + 1}`,
              }),
            ),
          )
        },
        [
          ['Window Batch Group Two One', 'Window Batch Group Two Two'],
          [
            'Window Batch Group Three One',
            'Window Batch Group Three Two',
            'Window Batch Group Three Three',
          ],
        ],
      )

      await page.evaluate(
        async ({
          keepTitles,
          keepUrl,
        }: {
          keepTitles: string[]
          keepUrl: string
        }) => {
          const currentWindow = await chrome.windows.getCurrent()
          if (currentWindow.id === undefined) return
          const tabs = await chrome.tabs.query({ windowId: currentWindow.id })
          const extraIds = tabs
            .filter(
              (tab) =>
                tab.id !== undefined &&
                tab.url !== keepUrl &&
                !keepTitles.includes(tab.title ?? ''),
            )
            .flatMap((tab) => (tab.id === undefined ? [] : [tab.id]))
          if (extraIds.length > 0) await chrome.tabs.remove(extraIds)
        },
        { keepTitles: titles, keepUrl: page.url() },
      )

      await expect(page.locator('[data-nav-type="group"]')).toHaveCount(2)
      const currentWindowTabCount = await page.evaluate(async () => {
        const currentWindow = await chrome.windows.getCurrent()
        return currentWindow.id === undefined
          ? 0
          : (await chrome.tabs.query({ windowId: currentWindow.id })).length
      })
      expect(currentWindowTabCount).toBe(7)

      const windowRow = (await getAllItems(page, 'window')).first()
      await windowRow.click()
      const summary = page.locator('[data-selection-summary]').first()
      await expect(summary).toHaveAttribute('data-selected-windows', '1')
      await expect(summary).toHaveAttribute('data-selected-groups', '2')
      await expect(summary).toHaveAttribute('data-selected-tabs', '1')

      await windowRow.click({ button: 'right' })
      await expect(summary).toHaveAttribute(
        'data-selected-tabs',
        String(currentWindowTabCount),
      )
      await expect(
        page.locator('[data-nav-type="tab"][data-selected="true"]'),
      ).toHaveCount(7)
      const menu = page.locator('[data-action-bar-menu]')
      await expect(
        menu.getByRole('button', { name: 'Close 7 tabs' }),
      ).toBeVisible()
    })

    test('selecting a window targets its tabs in the batch', async ({
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

          // A plain window click selects its active tab only.
          expect(await countSelected(page, 'window')).toBe(1)
          await expect(
            page.locator('[data-selection-summary]').first(),
          ).toHaveAttribute('data-selected-tabs', '1')
        }
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('Backspace closes the focused window', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const windowId = await page.evaluate(async () => {
        const createdWindow = await chrome.windows.create({ focused: false })
        if (createdWindow.id === undefined) {
          throw new Error('The test window was not created.')
        }
        await Promise.all([
          chrome.tabs.create({
            windowId: createdWindow.id,
            url: 'data:text/html,<title>Window close test one</title>',
          }),
          chrome.tabs.create({
            windowId: createdWindow.id,
            url: 'data:text/html,<title>Window close test two</title>',
          }),
        ])
        return createdWindow.id
      })
      const windowRow = page.locator(
        `[data-nav-type="window"][data-nav-id="${windowId}"]`,
      )

      await expect(windowRow).toBeVisible()
      await windowRow.click()
      await page.keyboard.press('Backspace')

      await expect(windowRow).toHaveCount(0)
    })

    test('Backspace closes the selected tab batch', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = ['Keyboard Batch One', 'Keyboard Batch Two']
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )
      await openTabManager(page, extensionId)

      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title }).first()
      const firstTab = tabByTitle(titles[0]!)
      const secondTab = tabByTitle(titles[1]!)

      await expect(firstTab).toBeVisible()
      await firstTab.click()
      await secondTab.click({ modifiers: ['Meta'] })
      expect(await countSelected(page, 'tab')).toBe(2)
      await page.keyboard.press('Backspace')

      const closeToast = page.getByText('2 tabs closed')
      await expect(closeToast).toHaveCount(1)
      await expect(closeToast).toBeVisible()
      await expect(
        page
          .locator('[data-sonner-toast]')
          .filter({ hasText: /selected tabs.*successfully/i }),
      ).toHaveCount(0)
      await expect(firstTab).toHaveCount(0)
      await expect(secondTab).toHaveCount(0)
    })

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

    test('Context Menu key opens the shared action overflow', async ({
      page,
      extensionId,
    }) => {
      await openTabManager(page, extensionId)

      const firstTab = (await getAllItems(page, 'tab')).first()
      await firstTab.click()
      await page.keyboard.press('ContextMenu')

      const trigger = page.getByRole('button', { name: 'More actions' })
      await expect(trigger).toBeFocused()
      await expect(page.locator('[data-action-bar-menu]')).toBeVisible()
      await expect(page.locator('[data-radix-menu-content]')).toHaveCount(0)
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

  test.describe('Batch actions', () => {
    test('selection counts and the menu trigger keep fixed positions', async ({
      page,
      extensionId,
      context,
    }) => {
      const extraTab = await context.newPage()
      await extraTab.goto(
        'data:text/html,%3Ctitle%3EAction%20bar%20QA%3C/title%3E',
      )
      await openTabManager(page, extensionId)
      const tabs = await getAllItems(page, 'tab')
      expect(await tabs.count()).toBeGreaterThan(1)

      const actionBarGeometry = () =>
        page.locator('[data-action-bar-root]').evaluate((root) => {
          const summary = root.querySelector('[data-selection-summary]')
          const trigger = root.querySelector('[data-action-bar-menu-trigger]')
          if (
            !(summary instanceof HTMLElement) ||
            !(trigger instanceof HTMLElement)
          ) {
            throw new Error('Action bar controls were not found.')
          }
          return {
            summaryX: summary.getBoundingClientRect().x,
            summaryRight: summary.getBoundingClientRect().right,
            triggerX: trigger.getBoundingClientRect().x,
          }
        })

      const initialGeometry = await actionBarGeometry()
      expect(initialGeometry.summaryRight).toBeLessThan(
        initialGeometry.triggerX,
      )
      expect(
        initialGeometry.triggerX - initialGeometry.summaryRight,
      ).toBeLessThanOrEqual(9)
      await tabs.first().click()
      const oneTabGeometry = await actionBarGeometry()
      await tabs.nth(1).click({ modifiers: ['Meta'] })
      const twoTabGeometry = await actionBarGeometry()

      expect(oneTabGeometry.summaryX).toBe(initialGeometry.summaryX)
      expect(oneTabGeometry.triggerX).toBe(initialGeometry.triggerX)
      expect(twoTabGeometry.summaryX).toBe(initialGeometry.summaryX)
      expect(twoTabGeometry.triggerX).toBe(initialGeometry.triggerX)
    })

    test('contextual group rename follows selection cardinality', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = [
        'Batch QA One',
        'Batch QA Two',
        'Batch QA Three',
        'Batch QA Four',
      ]
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )
      await openTabManager(page, extensionId)

      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title }).first()
      const groupRows = page.locator('[data-nav-type="group"]')

      await expect(tabByTitle(titles[0]!)).toBeVisible()
      await tabByTitle(titles[0]!).click()
      await tabByTitle(titles[1]!).click({ modifiers: ['Meta'] })
      const firstSelectionMenu = await openActionMenu(page)
      await firstSelectionMenu
        .getByRole('button', { name: 'Group 2 tabs' })
        .click()
      await page.getByRole('button', { name: /New Group/ }).click()
      await expect(groupRows).toHaveCount(1)

      const firstWindow = (await getAllItems(page, 'window')).first()
      await firstWindow.click()
      await expect(page.locator('[data-selection-summary]')).toHaveAttribute(
        'data-selected-groups',
        '1',
      )
      await expect(groupRows.first()).toHaveAttribute('data-selected', 'true')

      await groupRows.first().getByRole('button').first().click()
      await groupRows.first().click({ button: 'right' })
      await expect(page.locator('[data-radix-menu-content]')).toHaveCount(0)
      await expect(page.locator('[data-action-bar-root]')).toBeVisible()
      const overflowMenu = page.locator('[data-action-bar-menu]')
      await expect(overflowMenu).toBeVisible()
      const renameAction = page.getByRole('button', { name: 'Rename Group' })
      await expect(
        overflowMenu.getByRole('button', { name: 'Rename Group' }),
      ).toBeEnabled()
      await page.keyboard.press('Escape')

      await tabByTitle(titles[2]!).click()
      await tabByTitle(titles[3]!).click({ modifiers: ['Meta'] })
      const secondSelectionMenu = await openActionMenu(page)
      await secondSelectionMenu
        .getByRole('button', { name: 'Group 2 tabs' })
        .click()
      await page.getByRole('button', { name: /New Group/ }).click()
      await expect(groupRows).toHaveCount(2)

      await groupRows.first().getByRole('button').first().click()
      await groupRows
        .nth(1)
        .getByRole('button')
        .first()
        .click({ modifiers: ['Meta'] })
      const groupsMenu = await openActionMenu(page)
      await expect(
        groupsMenu.getByRole('button', { name: 'Rename Group' }),
      ).toBeDisabled()
      await page.keyboard.press('Escape')

      await tabByTitle(titles[0]!).click()
      await expect(renameAction).toHaveCount(0)
    })

    test('overflow submenus replace the menu and keep Back fixed below scrolling actions', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = ['Batch Color One', 'Batch Color Two']
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )
      await openTabManager(page, extensionId)
      await page.setViewportSize({ width: 430, height: 400 })

      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title }).first()
      await tabByTitle(titles[0]!).click()
      await tabByTitle(titles[1]!).click({ modifiers: ['Meta'] })
      const selectionMenu = await openActionMenu(page)
      await selectionMenu.getByRole('button', { name: 'Group 2 tabs' }).click()
      await page.getByRole('button', { name: /New Group/ }).click()
      await expect(page.locator('[data-nav-type="group"]')).toHaveCount(1)
      await page.locator('[data-nav-type="group"] button').first().click()

      const menu = await openActionMenu(page)
      const trigger = page.getByRole('button', { name: 'More actions' })
      await expect(trigger).toBeVisible()
      await expect(menu.locator('[data-selection-summary]')).toHaveCount(0)
      await expect(menu.getByLabel('Selected items')).toHaveCount(0)
      const menuBox = await menu.boundingBox()
      const triggerBox = await trigger.boundingBox()
      const barBox = await page.locator('[data-action-bar-root]').boundingBox()
      expect(menuBox).not.toBeNull()
      expect(triggerBox).not.toBeNull()
      expect(barBox).not.toBeNull()
      expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(
        barBox!.x + barBox!.width,
      )
      expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(
        triggerBox!.y + 1,
      )

      await menu.getByRole('button', { name: 'Change Color' }).click()
      const panel = page.locator('[data-action-bar-panel]')
      await expect(panel).toBeVisible()
      await expect(panel.locator('[aria-label$="color swatch"]')).toHaveCount(9)
      await expect(panel.locator('[data-action-bar-menu]')).toHaveCount(0)
      const scrollRegion = panel.locator(
        '[data-action-bar-panel-scroll-region]',
      )
      const back = panel.locator('[data-action-bar-panel-back]')
      await expect(back).toBeVisible()
      await expect
        .poll(() =>
          scrollRegion.evaluate(
            (element) => element.scrollHeight > element.clientHeight,
          ),
        )
        .toBe(true)
      await page.waitForTimeout(250)
      const beforeScroll = await back.boundingBox()
      await scrollRegion.evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })
      const afterScroll = await back.boundingBox()
      expect(beforeScroll).not.toBeNull()
      expect(afterScroll).not.toBeNull()
      expect(Math.abs(afterScroll!.y - beforeScroll!.y)).toBeLessThan(2)
      await back.click()
      await expect(page.locator('[data-action-bar-menu]')).toBeVisible()
      await expect(trigger).toBeFocused()

      await menu.getByRole('button', { name: /Collapse Group/i }).click()
      await expect(
        page.locator('[data-sonner-toast]').filter({ hasText: /collapsed/i }),
      ).toHaveCount(0)
      const expandMenu = await openActionMenu(page)
      await expandMenu.getByRole('button', { name: /Expand Group/i }).click()
      await expect(
        page.locator('[data-sonner-toast]').filter({ hasText: /expanded/i }),
      ).toHaveCount(0)
    })

    test('the shared close action closes every selected tab', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = ['Batch Close One', 'Batch Close Two']
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )
      await openTabManager(page, extensionId)
      await page.setViewportSize({ width: 320, height: 600 })
      const status = page.locator('[data-sonner-toast]')
      await expect(status).toHaveCount(0)
      const actionBar = page.locator('[data-action-bar-root]')
      const emptyActionBarBox = await actionBar.boundingBox()
      const ellipsisBox = await page
        .getByRole('button', { name: 'More actions' })
        .boundingBox()
      const sidebarBox = await page.locator('aside').boundingBox()

      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title }).first()
      const firstTab = tabByTitle(titles[0]!)
      const secondTab = tabByTitle(titles[1]!)

      await expect(firstTab).toBeVisible()
      await firstTab.click()
      await secondTab.click({ modifiers: ['Meta'] })
      const menu = await openActionMenu(page)
      await expect(
        menu.getByRole('button', { name: 'Close 2 tabs' }),
      ).toBeEnabled()
      await menu.getByRole('button', { name: 'Close 2 tabs' }).click()

      const toast = page
        .locator('[data-sonner-toast]')
        .filter({ hasText: '2 tabs closed' })
      await expect(toast).toBeVisible()
      await page.waitForTimeout(450)
      const toastBox = await toast.boundingBox()
      const actionBarBox = await actionBar.boundingBox()
      expect(toastBox).not.toBeNull()
      expect(actionBarBox).not.toBeNull()
      expect(actionBarBox).toEqual(emptyActionBarBox)
      expect(toastBox).toEqual(actionBarBox)
      expect(toastBox!.x).toBeGreaterThanOrEqual(
        sidebarBox!.x + sidebarBox!.width,
      )
      expect(
        await toast
          .getByRole('button', { name: 'Dismiss notification' })
          .boundingBox(),
      ).toEqual(ellipsisBox)
      await expect(firstTab).toHaveCount(0)
      await expect(secondTab).toHaveCount(0)

      await expect(
        page.getByRole('button', { name: 'More actions' }),
      ).toHaveCount(0)
      const newTabButton = page.getByRole('button', {
        name: 'New Tab',
        exact: true,
      })
      const newTabBox = await newTabButton.boundingBox()
      expect(newTabBox).not.toBeNull()
      expect(newTabBox!.y + newTabBox!.height).toBeLessThan(toastBox!.y)
      const tabCount = await page.locator('[data-nav-type="tab"]').count()
      await newTabButton.click()
      await page.bringToFront()
      await expect(page.locator('[data-nav-type="tab"]')).toHaveCount(
        tabCount + 1,
      )
      await toast.getByRole('button', { name: 'Dismiss notification' }).click()
      await expect(status).toHaveCount(0)
      expect(await actionBar.boundingBox()).toEqual(emptyActionBarBox)
      const menuTrigger = page.getByRole('button', { name: 'More actions' })
      await expect(menuTrigger).toBeFocused()
      await menuTrigger.click()
      await expect(page.locator('[data-action-bar-menu]')).toBeVisible()
    })

    test('two-line confirmations cover the action bar without changing the layout', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = ['Notification One', 'Notification Two']
      for (const title of titles) {
        const tab = await context.newPage()
        await tab.goto(
          `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
        )
      }
      await openTabManager(page, extensionId)
      await page.bringToFront()
      await page.setViewportSize({ width: 320, height: 600 })
      const actionBar = page.locator('[data-action-bar-root]')
      const actionBarBox = await actionBar.boundingBox()
      await page.evaluate(() => {
        let attempt = 0
        chrome.tabs.discard = async (tabId) => {
          if (attempt++ === 0) throw new Error('Discard failed')
          return { ...(await chrome.tabs.get(tabId!)), discarded: true }
        }
      })

      const firstTab = page
        .locator('[data-nav-type="tab"]')
        .filter({ hasText: titles[0] })
      const secondTab = page
        .locator('[data-nav-type="tab"]')
        .filter({ hasText: titles[1] })
      await firstTab.click({ button: 'right' })
      await page.keyboard.press('Escape')
      await secondTab.click({ modifiers: ['Meta'] })
      const menu = await openActionMenu(page)
      await menu.getByRole('button', { name: 'Discard 2 tabs' }).click()

      const status = page.locator('[data-sonner-toast]')
      const message = status.getByText(
        '1 tab discarded from memory; 1 tab could not be discarded',
      )
      await expect(message).toBeVisible()
      await page.waitForTimeout(450)
      const lineCount = await message.evaluate((element) => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return range.getClientRects().length
      })
      expect(lineCount).toBe(2)
      const statusBox = await status.boundingBox()
      expect(statusBox).not.toBeNull()
      expect(actionBarBox).not.toBeNull()
      expect(await actionBar.boundingBox()).toEqual(actionBarBox)
      expect(statusBox).toEqual(actionBarBox)
      expect(
        await status.evaluate(
          (element) =>
            element.scrollWidth <= element.clientWidth &&
            element.scrollHeight <= element.clientHeight,
        ),
      ).toBe(true)

      const text = await message.innerText()
      await message.click({ clickCount: 3 })
      expect(
        await page.evaluate(() => window.getSelection()?.toString().trim()),
      ).toBe(text)
      await expect(status).toHaveCount(1)
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
      await page.keyboard.press(`${modifier}+c`)
      await page.evaluate(() => {
        const input = document.createElement('textarea')
        input.dataset.notificationCopy = ''
        document.body.append(input)
        input.focus()
      })
      await page.keyboard.press(`${modifier}+v`)
      const pasted = page.locator('[data-notification-copy]')
      await expect(pasted).toHaveValue(text)
      await pasted.evaluate((element) => element.remove())
      await status.getByRole('button', { name: 'Dismiss notification' }).focus()
      await page.mouse.move(0, 0)
      await expect(status).toHaveCount(0)
      expect(await actionBar.boundingBox()).toEqual(actionBarBox)
      await expect(
        page.getByRole('button', { name: 'More actions' }),
      ).toBeFocused()
    })

    test('stacked confirmations expand for reading and dismiss one at a time', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = [
        'Stack One',
        'Stack Two',
        'Stack Three',
        'Stack Four',
        'Stack Five',
      ]
      for (const title of titles) {
        const tab = await context.newPage()
        await tab.goto(
          `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
        )
      }
      await openTabManager(page, extensionId)
      await page.bringToFront()
      await page.setViewportSize({ width: 320, height: 600 })
      const actionBar = page.locator('[data-action-bar-root]')
      const actionBarBox = await actionBar.boundingBox()
      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title })
      const notifications = page.locator('[data-sonner-toast]')

      await tabByTitle(titles[0]!).click()
      await tabByTitle(titles[1]!).click({ modifiers: ['Meta'] })
      const menu = await openActionMenu(page)
      await menu.getByRole('button', { name: 'Reload 2 tabs' }).click()
      await expect(notifications).toHaveCount(1)
      await tabByTitle(titles[0]!).click()
      await tabByTitle(titles[1]!).click({ modifiers: ['Meta'] })
      await page.keyboard.press('Backspace')
      await expect(page.getByText('2 tabs closed')).toBeVisible()
      await tabByTitle(titles[2]!).click()
      await page.keyboard.press('Backspace')

      await expect(notifications).toHaveCount(3)
      await page.mouse.move(0, 0)
      await page.waitForTimeout(450)
      const frontBox = await notifications.first().boundingBox()
      const backBox = await notifications.last().boundingBox()
      expect(frontBox).not.toBeNull()
      expect(backBox).not.toBeNull()
      expect(actionBarBox).not.toBeNull()
      expect(frontBox).toEqual(actionBarBox)
      expect(backBox!.y).toBeLessThan(frontBox!.y)
      expect(backBox!.width).toBeLessThan(frontBox!.width)
      expect(backBox!.y).toBeLessThan(actionBarBox!.y)
      expect(backBox!.y).toBeGreaterThanOrEqual(actionBarBox!.y - 12)
      expect(backBox!.x).toBeGreaterThanOrEqual(actionBarBox!.x)
      expect(backBox!.x + backBox!.width).toBeLessThanOrEqual(
        actionBarBox!.x + actionBarBox!.width,
      )
      const newTabButton = page.getByRole('button', {
        name: 'New Tab',
        exact: true,
      })
      await newTabButton.scrollIntoViewIfNeeded()
      const newTabBox = await newTabButton.boundingBox()
      expect(newTabBox).not.toBeNull()
      expect(newTabBox!.y + newTabBox!.height).toBeLessThan(backBox!.y)

      await notifications.first().hover()
      await page.waitForTimeout(450)
      const expandedBackBox = await notifications.last().boundingBox()
      const expandedMiddleBox = await notifications.nth(1).boundingBox()
      expect(expandedBackBox).not.toBeNull()
      expect(expandedMiddleBox).not.toBeNull()
      expect(expandedBackBox!.width).toBe(actionBarBox!.width)
      expect(expandedBackBox!.y + expandedBackBox!.height).toBeLessThan(
        expandedMiddleBox!.y,
      )
      expect(expandedMiddleBox!.y + expandedMiddleBox!.height).toBeLessThan(
        frontBox!.y,
      )
      await notifications.last().click()
      await page.waitForTimeout(4500)
      await expect(notifications).toHaveCount(3)
      await page.keyboard.press('Alt+t')
      await expect(page.locator('[data-sonner-toaster]')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(notifications.first()).toBeFocused()
      await page.keyboard.press('Tab')
      const frontX = () =>
        notifications
          .first()
          .getByRole('button', { name: 'Dismiss notification' })
      await expect(frontX()).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(notifications.nth(1)).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(frontX()).toBeFocused()
      await frontX().hover()
      await page.keyboard.press('Enter')
      await expect(notifications).toHaveCount(2)
      await expect(notifications.first()).toHaveText('2 tabs closed')
      await expect(frontX()).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(notifications).toHaveCount(1)
      await expect(frontX()).toBeFocused()
      await page.waitForTimeout(4500)
      await expect(notifications).toHaveCount(1)
      await page.keyboard.press('Enter')
      await expect(notifications).toHaveCount(0)
      await expect(
        page.getByRole('button', { name: 'More actions' }),
      ).toBeFocused()

      for (const title of titles.slice(3)) {
        await tabByTitle(title).click()
        await page.keyboard.press('Backspace')
      }
      await expect(notifications).toHaveCount(2)
      await notifications.first().hover()
      await page.mouse.move(0, 0)
      await expect(notifications).toHaveCount(0, { timeout: 5000 })
      expect(await actionBar.boundingBox()).toEqual(actionBarBox)
      await expect(
        page.getByRole('button', { name: 'More actions' }),
      ).toBeVisible()
    })

    test('the shared move action moves the selected batch to one new window', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = ['Keyboard Move One', 'Keyboard Move Two']
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )
      await openTabManager(page, extensionId)

      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title }).first()
      const firstTab = tabByTitle(titles[0]!)
      const secondTab = tabByTitle(titles[1]!)
      const windows = await getAllItems(page, 'window')
      const initialWindowCount = await windows.count()

      await expect(firstTab).toBeVisible()
      await firstTab.click()
      await secondTab.click({ modifiers: ['Meta'] })
      const menu = await openActionMenu(page)
      await menu.getByRole('button', { name: 'Move 2 tabs' }).click()
      await page.getByRole('button', { name: /New Window · 2/ }).click()

      await expect(page.getByText('2 tabs moved')).toBeVisible()
      await expect(windows).toHaveCount(initialWindowCount + 1)
      await expect(tabByTitle(titles[0]!)).toBeVisible()
      await expect(tabByTitle(titles[1]!)).toBeVisible()
    })

    test('action labels count only tabs targeted by the operation', async ({
      page,
      extensionId,
      context,
    }) => {
      const titles = [
        'Grouped Count One',
        'Grouped Count Two',
        'Loose Count Three',
      ]
      await Promise.all(
        titles.map(async (title) => {
          const tab = await context.newPage()
          await tab.goto(
            `data:text/html,%3Ctitle%3E${encodeURIComponent(title)}%3C/title%3E`,
          )
        }),
      )
      await openTabManager(page, extensionId)

      const tabByTitle = (title: string) =>
        page.locator('[data-nav-type="tab"]').filter({ hasText: title }).first()
      await tabByTitle(titles[0]!).click()
      await tabByTitle(titles[1]!).click({ modifiers: ['Meta'] })
      const groupingMenu = await openActionMenu(page)
      await groupingMenu.getByRole('button', { name: 'Group 2 tabs' }).click()
      await page.getByRole('button', { name: /New Group/ }).click()

      await tabByTitle(titles[2]!).click({ modifiers: ['Meta'] })
      const menu = await openActionMenu(page)
      await expect(
        menu.getByRole('button', { name: 'Remove 2 tabs from group' }),
      ).toBeVisible()
      await expect(
        menu.getByRole('button', { name: 'Remove 3 tabs from group' }),
      ).toHaveCount(0)
      await expect(
        menu.getByRole('button', { name: 'Reload 3 tabs' }),
      ).toBeVisible()
      await expect(
        menu.getByRole('button', { name: 'Copy 3 tabs' }),
      ).toBeVisible()
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
