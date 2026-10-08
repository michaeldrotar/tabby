/// <reference types="chrome" />

import { expect, test } from './fixtures'
import type { Page } from '@playwright/test'

const getTabs = (page: Page) => page.locator('[data-nav-type="tab"]')
const getWindows = (page: Page) => page.locator('[data-nav-type="window"]')
const getGroups = (page: Page) => page.locator('[data-nav-type="group"]')
const getTab = (page: Page, title: string) =>
  getTabs(page).filter({ hasText: title }).first()
const getSelected = (page: Page, type: 'window' | 'tab' | 'group') =>
  page.locator(`[data-nav-type="${type}"][data-selected="true"]`)
const getSelectionSummary = (page: Page) =>
  page.locator('[data-selection-summary]').first()

const dismissNotifications = async (page: Page) => {
  const notifications = page.locator('[data-sonner-toast]')
  const dismissButton = page
    .locator('[data-sonner-toast][data-front="true"]')
    .getByRole('button', { name: 'Dismiss notification' })
  while (await dismissButton.isVisible()) {
    const count = await notifications.count()
    await dismissButton.click()
    await expect(notifications).toHaveCount(count - 1)
  }
}

const openActionMenu = async (page: Page) => {
  await dismissNotifications(page)
  await page.getByRole('button', { name: 'More actions' }).click()
  return page.locator('[data-action-bar-menu]')
}

test('extension tab management workflow', async ({ page, extensionId }) => {
  test.setTimeout(90_000)
  expect(extensionId).toMatch(/^[a-z]{32}$/)

  await test.step('open the extension pages', async () => {
    await page.goto(`chrome-extension://${extensionId}/options/index.html`)
    await expect(page).toHaveTitle('Options')

    await page.goto(`chrome-extension://${extensionId}/tab-manager/index.html`)
    await expect(page).toHaveTitle('Tab Manager')
    await page.waitForSelector('[data-nav-type="window"]')

    await page.getByRole('button', { name: 'Expand sidebar' }).click()
    await expect(
      page.getByRole('button', { name: 'Collapse sidebar' }),
    ).toBeVisible()
  })

  const sourceWindowId = await page.evaluate(async () => {
    const [currentTab, currentWindow, windows] = await Promise.all([
      chrome.tabs.getCurrent(),
      chrome.windows.getCurrent(),
      chrome.windows.getAll({ populate: false }),
    ])
    if (currentTab?.id === undefined || currentWindow.id === undefined) {
      throw new Error('The Tab Manager browser window was not available.')
    }

    await Promise.all(
      windows
        .filter((window) => window.id !== currentWindow.id)
        .flatMap((window) =>
          window.id === undefined ? [] : [chrome.windows.remove(window.id)],
        ),
    )
    const otherTabIds = (
      await chrome.tabs.query({
        windowId: currentWindow.id,
      })
    )
      .filter((tab) => tab.id !== currentTab.id)
      .flatMap((tab) => (tab.id === undefined ? [] : [tab.id]))
    if (otherTabIds.length > 0) await chrome.tabs.remove(otherTabIds)

    return currentWindow.id
  })

  const titles = [
    'Workflow Tab One',
    'Workflow Tab Two',
    'Workflow Tab Three',
    'Workflow Tab Four',
  ]

  await test.step('select tabs and inspect batch actions', async () => {
    await page.evaluate(
      async ({ windowId, titles }) => {
        for (const title of titles) {
          await chrome.tabs.create({
            windowId,
            active: false,
            url: `data:text/html,${encodeURIComponent(`<title>${title}</title>`)}`,
          })
        }
      },
      { windowId: sourceWindowId, titles },
    )

    for (const title of titles) {
      await expect(getTab(page, title)).toBeVisible()
    }

    const firstTab = getTab(page, titles[0]!)
    const secondTab = getTab(page, titles[1]!)
    const fourthTab = getTab(page, titles[3]!)
    const summary = getSelectionSummary(page)
    await expect(summary).toHaveAttribute('data-selected-windows', '1')
    await expect(summary).toHaveAttribute('data-selected-tabs', '1')

    await firstTab.click()
    await fourthTab.click({ modifiers: ['Shift'] })
    await expect(getSelected(page, 'tab')).toHaveCount(4)
    await expect(summary).toHaveAttribute('data-selected-tabs', '4')

    await firstTab.click()
    await page.keyboard.press('ArrowDown')
    await expect(secondTab).toHaveAttribute('data-selected', 'true')
    await page.keyboard.press('Space')
    await expect(getSelected(page, 'tab')).toHaveCount(1)
    await expect(secondTab).toHaveAttribute('data-selected', 'true')

    await page.keyboard.press('ArrowDown')
    await expect(getSelected(page, 'tab')).toHaveCount(1)
    await expect(secondTab).toHaveAttribute('data-selected', 'true')
    await expect(getTab(page, titles[2]!)).toHaveAttribute(
      'data-selected',
      'false',
    )
    await page.keyboard.press('Space')
    await expect(getSelected(page, 'tab')).toHaveCount(2)
    await expect(secondTab).toHaveAttribute('data-selected', 'true')
    await expect(getTab(page, titles[2]!)).toHaveAttribute(
      'data-selected',
      'true',
    )
    await page.keyboard.press('Space')
    await expect(getSelected(page, 'tab')).toHaveCount(1)
    await expect(getTab(page, titles[2]!)).toHaveAttribute(
      'data-selected',
      'false',
    )

    await firstTab.click()
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')
    await expect(getSelected(page, 'tab')).toHaveCount(3)
    await expect(firstTab).toHaveAttribute('data-selected', 'true')
    await expect(getTab(page, titles[2]!)).toHaveAttribute(
      'data-selected',
      'true',
    )

    await page.keyboard.press('Meta+a')
    await expect(getSelected(page, 'tab')).toHaveCount(
      await getTabs(page).count(),
    )
    await page.keyboard.press('Escape')
    await expect(getSelected(page, 'tab')).toHaveCount(1)

    await firstTab.click()
    await page.keyboard.press('ContextMenu')
    const keyboardContextMenu = page.locator('[data-action-bar-menu]')
    await expect(
      page.getByRole('button', { name: 'More actions' }),
    ).toBeFocused()
    await expect(keyboardContextMenu).toBeVisible()
    await expect(page.locator('[data-radix-menu-content]')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(keyboardContextMenu).toHaveCount(0)

    await page.bringToFront()
    await firstTab.click({ button: 'right' })
    const rightClickMenu = page.locator('[data-action-bar-menu]')
    await expect(rightClickMenu).toBeVisible()
    await expect(page.locator('[data-radix-menu-content]')).toHaveCount(0)
    await expect(firstTab).toHaveAttribute('data-selected', 'true')
    await page.keyboard.press('Escape')
    await expect(rightClickMenu).toHaveCount(0)
    await secondTab.click({ modifiers: ['Meta'] })
    await expect(firstTab).toHaveAttribute('data-selected', 'true')
    await expect(secondTab).toHaveAttribute('data-selected', 'true')
    await expect(getSelected(page, 'tab')).toHaveCount(2)
    await expect(summary).toHaveAttribute('data-selected-tabs', '2')

    const discardableSelectedCount = await page.evaluate(
      async ({ windowId, titles }) => {
        const tabs = await chrome.tabs.query({ windowId })
        return titles.filter((title) => {
          const tab = tabs.find((candidate) => candidate.title === title)
          return tab && !tab.active && !tab.discarded
        }).length
      },
      { windowId: sourceWindowId, titles: titles.slice(0, 2) },
    )
    expect(discardableSelectedCount).toBe(2)

    const menu = await openActionMenu(page)
    for (const action of [
      'Close 2 tabs',
      'Move 2 tabs',
      'Group 2 tabs',
      'Pin 2 tabs',
      'Duplicate 2 tabs',
      'Reload 2 tabs',
      'Discard 2 tabs',
      'Copy 2 tabs',
    ]) {
      await expect(menu.getByRole('button', { name: action })).toBeVisible()
    }

    await menu.getByRole('button', { name: 'Copy 2 tabs' }).click()
    const copyPanel = page.locator('[data-action-bar-panel]')
    await expect(
      copyPanel.getByRole('button', { name: 'Copy URLs' }),
    ).toBeVisible()
    await expect(
      copyPanel.getByRole('button', { name: 'Copy titles', exact: true }),
    ).toBeVisible()
    await expect(
      copyPanel.getByRole('button', {
        name: 'Copy titles and URLs',
        exact: true,
      }),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    let actionMenu = await openActionMenu(page)
    await actionMenu.getByRole('button', { name: 'Pin 2 tabs' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          async ({ windowId, titles }) => {
            const tabs = await chrome.tabs.query({ windowId })
            return titles.every(
              (title) => tabs.find((tab) => tab.title === title)?.pinned,
            )
          },
          { windowId: sourceWindowId, titles: titles.slice(0, 2) },
        ),
      )
      .toBe(true)

    actionMenu = await openActionMenu(page)
    await expect(
      actionMenu.getByRole('button', { name: 'Unpin 2 tabs' }),
    ).toBeVisible()
    await actionMenu.getByRole('button', { name: 'Unpin 2 tabs' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          async ({ windowId, titles }) => {
            const tabs = await chrome.tabs.query({ windowId })
            return titles.every(
              (title) => !tabs.find((tab) => tab.title === title)?.pinned,
            )
          },
          { windowId: sourceWindowId, titles: titles.slice(0, 2) },
        ),
      )
      .toBe(true)
  })

  await test.step('group, rename, color, and add a tab', async () => {
    const groupingMenu = await openActionMenu(page)
    await groupingMenu.getByRole('button', { name: 'Group 2 tabs' }).click()
    const groupPanel = page.locator('[data-action-bar-panel]')
    await groupPanel.getByRole('button', { name: /New Group.*2/ }).click()
    await expect(getGroups(page)).toHaveCount(1)

    const groupRow = getGroups(page).first()
    await groupRow.locator('button').first().click()
    await expect(getSelected(page, 'group')).toHaveCount(1)
    await expect(getSelectionSummary(page)).toHaveAttribute(
      'data-selected-groups',
      '1',
    )
    await expect(getSelectionSummary(page)).toHaveAttribute(
      'data-selected-tabs',
      '2',
    )
    const groupMenu = await openActionMenu(page)
    await expect(
      groupMenu.getByRole('button', { name: 'Rename Group' }),
    ).toBeEnabled()
    await expect(
      groupMenu.getByRole('button', { name: 'Ungroup 2 tabs' }),
    ).toBeVisible()
    await groupMenu.getByRole('button', { name: 'Rename Group' }).click()
    const renameInput = groupRow.getByRole('textbox')
    await expect(renameInput).toBeFocused()
    await renameInput.fill('Project group')
    await renameInput.press('Enter')
    await expect(groupRow).toContainText('Project group')

    const colorMenu = await openActionMenu(page)
    await colorMenu.getByRole('button', { name: 'Change Color' }).click()
    const colorPanel = page.locator('[data-action-bar-panel]')
    await expect(
      colorPanel.locator('[aria-label$="color swatch"]'),
    ).toHaveCount(9)
    await colorPanel.getByRole('button', { name: 'Blue' }).click()

    const groupId = Number(await groupRow.getAttribute('data-group-id'))
    await expect
      .poll(() =>
        page.evaluate(
          async ({ windowId, groupId }) => {
            const groups = await chrome.tabGroups.query({ windowId })
            return groups.find((group) => group.id === groupId)?.color
          },
          { windowId: sourceWindowId, groupId },
        ),
      )
      .toBe('blue')

    const collapseMenu = await openActionMenu(page)
    await collapseMenu.getByRole('button', { name: 'Collapse Group' }).click()
    await expect(groupRow).toHaveAttribute('data-collapsed', 'true')
    const expandMenu = await openActionMenu(page)
    await expandMenu.getByRole('button', { name: 'Expand Group' }).click()
    await expect(groupRow).not.toHaveAttribute('data-collapsed', 'true')

    const groupTabSnapshot = await page.evaluate(
      async ({ windowId, groupId }) => {
        const tabs = (await chrome.tabs.query({ windowId })).filter(
          (tab) => tab.groupId === groupId,
        )
        return {
          ids: tabs.flatMap((tab) => (tab.id === undefined ? [] : [tab.id])),
          lastIndex: tabs.at(-1)?.index ?? -1,
        }
      },
      { windowId: sourceWindowId, groupId },
    )
    await page.getByRole('button', { name: 'New Tab in Project group' }).click()
    await expect
      .poll(() =>
        page.evaluate(
          async ({ windowId, groupId, groupTabSnapshot }) => {
            const tabs = await chrome.tabs.query({ windowId })
            const groupTabs = tabs.filter((tab) => tab.groupId === groupId)
            const addedTab = groupTabs.find(
              (tab) =>
                tab.id !== undefined && !groupTabSnapshot.ids.includes(tab.id),
            )
            if (addedTab?.id === undefined) return null
            return {
              count: groupTabs.length,
              groupId: addedTab.groupId,
              index: addedTab.index,
              active: addedTab.active,
              lastInGroup: groupTabs.at(-1)?.id === addedTab.id,
              windowFocused: (await chrome.windows.get(windowId)).focused,
            }
          },
          { windowId: sourceWindowId, groupId, groupTabSnapshot },
        ),
      )
      .toEqual({
        count: 3,
        groupId,
        index: groupTabSnapshot.lastIndex + 1,
        active: true,
        lastInGroup: true,
        windowFocused: true,
      })
    await page.bringToFront()

    const existingTabIds = await page.evaluate(
      async (windowId) =>
        (await chrome.tabs.query({ windowId })).flatMap((tab) =>
          tab.id === undefined ? [] : [tab.id],
        ),
      sourceWindowId,
    )
    const existingTabCount = existingTabIds.length
    await page.getByRole('button', { name: 'New Tab', exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(
          async ({ windowId, existingTabIds }) => {
            const tabs = await chrome.tabs.query({ windowId })
            const addedTab = tabs.find(
              (tab) => tab.id !== undefined && !existingTabIds.includes(tab.id),
            )
            if (addedTab?.id === undefined) return null
            return {
              count: tabs.length,
              index: addedTab.index,
              active: addedTab.active,
              groupId: addedTab.groupId,
              lastTab: tabs.at(-1)?.id === addedTab.id,
              windowFocused: (await chrome.windows.get(windowId)).focused,
            }
          },
          { windowId: sourceWindowId, existingTabIds },
        ),
      )
      .toEqual({
        count: existingTabCount + 1,
        index: existingTabCount,
        active: true,
        groupId: -1,
        lastTab: true,
        windowFocused: true,
      })
    await page.bringToFront()
  })

  let destinationWindowId = -1
  await test.step('create a window and move a tab batch into it', async () => {
    await page.getByRole('button', { name: 'New Window', exact: true }).click()
    await expect(getWindows(page)).toHaveCount(2)

    destinationWindowId = await page.evaluate(async (sourceId) => {
      const windows = await chrome.windows.getAll({ populate: false })
      const destination = windows.find((window) => window.id !== sourceId)
      if (destination?.id === undefined) {
        throw new Error('The new browser window was not found.')
      }
      return destination.id
    }, sourceWindowId)
    const createdWindowState = await page.evaluate(async (windowId) => {
      const [window, lastFocusedWindow] = await Promise.all([
        chrome.windows.get(windowId),
        chrome.windows.getLastFocused(),
      ])
      return { focused: window.focused, lastFocusedId: lastFocusedWindow.id }
    }, destinationWindowId)
    expect(createdWindowState).toEqual({
      focused: true,
      lastFocusedId: destinationWindowId,
    })
    await expect(getWindows(page).last()).toHaveAttribute(
      'data-nav-id',
      String(destinationWindowId),
    )
    await page.bringToFront()

    const firstDestinationTabId = await page.evaluate(async (windowId) => {
      const startingTab = (await chrome.tabs.query({ windowId })).at(0)
      if (startingTab?.id === undefined) {
        throw new Error('The new browser window did not have its starting tab.')
      }
      const firstTab = await chrome.tabs.create({
        windowId,
        index: 0,
        active: false,
        url: `data:text/html,${encodeURIComponent('<title>Workflow Destination First</title>')}`,
      })
      if (firstTab.id === undefined) {
        throw new Error('The first destination tab was not created.')
      }
      await chrome.tabs.create({
        windowId,
        index: 1,
        active: true,
        url: `data:text/html,${encodeURIComponent('<title>Workflow Destination Active</title>')}`,
      })
      await chrome.tabs.remove(startingTab.id)
      return firstTab.id
    }, destinationWindowId)
    await expect
      .poll(() =>
        page.evaluate(
          async (tabId) => (await chrome.tabs.get(tabId)).title,
          firstDestinationTabId,
        ),
      )
      .toBe('Workflow Destination First')
    await page.bringToFront()

    const destinationWindow = page.locator(
      `[data-nav-type="window"][data-nav-id="${destinationWindowId}"]`,
    )
    await expect(destinationWindow).toContainText('Workflow Destination Active')

    const optionsPagePromise = page.context().waitForEvent('page')
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    const optionsPage = await optionsPagePromise
    await expect(optionsPage).toHaveTitle('Options')
    const identificationSelect = optionsPage
      .getByRole('combobox')
      .filter({ hasText: 'Active Tab' })
    await identificationSelect.click()
    await optionsPage.getByRole('option', { name: 'First Tab' }).click()
    await expect(
      optionsPage.getByRole('combobox').filter({ hasText: 'First Tab' }),
    ).toBeVisible()
    await optionsPage.close()
    await page.bringToFront()
    await expect(destinationWindow).toContainText('Workflow Destination First')

    const firstTab = getTab(page, titles[2]!)
    const secondTab = getTab(page, titles[3]!)
    await firstTab.click()
    await secondTab.click({ modifiers: ['Meta'] })
    await expect(getSelected(page, 'tab')).toHaveCount(2)

    const menu = await openActionMenu(page)
    await menu.getByRole('button', { name: 'Move 2 tabs' }).click()
    const movePanel = page.locator('[data-action-bar-panel]')
    const destination = movePanel.getByRole('button', {
      name: 'Workflow Destination First · 2',
    })
    await expect(destination).toContainText('· 2')
    await destination.click()
    const movedNotification = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: '2 tabs moved' })
    await expect(movedNotification).toBeVisible()
    await expect(
      movedNotification.getByRole('button', { name: 'Dismiss notification' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'More actions' }),
    ).toHaveCount(0)
    await movedNotification
      .getByRole('button', { name: 'Dismiss notification' })
      .click()
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)

    await expect
      .poll(() =>
        page.evaluate(async (titles) => {
          const tabs = await chrome.tabs.query({})
          return titles.map(
            (title) => tabs.find((tab) => tab.title === title)?.windowId,
          )
        }, titles.slice(2)),
      )
      .toEqual([destinationWindowId, destinationWindowId])

    const sourceWindow = page.locator(
      `[data-nav-type="window"][data-nav-id="${sourceWindowId}"]`,
    )
    const totalTabCount = await page.evaluate(
      async () => (await chrome.tabs.query({})).length,
    )
    await sourceWindow.click()
    await destinationWindow.click({ modifiers: ['Meta'] })
    await expect(getSelected(page, 'window')).toHaveCount(2)
    await expect(getSelectionSummary(page)).toHaveAttribute(
      'data-selected-tabs',
      String(totalTabCount),
    )

    const windowMenu = await openActionMenu(page)
    await expect(
      windowMenu.getByRole('button', { name: 'Close 2 windows' }),
    ).toBeVisible()
    const crossWindowGroupAction = windowMenu.getByRole('button', {
      name: `Group ${totalTabCount} tabs`,
    })
    await expect(crossWindowGroupAction).toBeDisabled()
    await expect(crossWindowGroupAction).toHaveAttribute('title', /same window/)
    await page.keyboard.press('Escape')
  })

  await test.step('close the moved tabs and finish with one window', async () => {
    const destinationWindow = page.locator(
      `[data-nav-type="window"][data-nav-id="${destinationWindowId}"]`,
    )
    await destinationWindow.click()
    await destinationWindow.click({ button: 'right' })
    const windowContextMenu = page.locator('[data-action-bar-menu]')
    await expect(windowContextMenu).toBeVisible()
    await expect(
      windowContextMenu.getByRole('button', { name: 'Close Window' }),
    ).toBeVisible()
    await page.keyboard.press('Escape')

    await destinationWindow.click()
    const firstMovedTab = getTab(page, titles[2]!)
    const secondMovedTab = getTab(page, titles[3]!)
    await firstMovedTab.click()
    await secondMovedTab.click({ modifiers: ['Meta'] })
    const tabMenu = await openActionMenu(page)
    await tabMenu.getByRole('button', { name: 'Close 2 tabs' }).click()
    await expect(firstMovedTab).toHaveCount(0)
    await expect(secondMovedTab).toHaveCount(0)
    const closedNotification = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: '2 tabs closed' })
    await expect(closedNotification).toBeVisible()
    await closedNotification
      .getByRole('button', { name: 'Dismiss notification' })
      .click()
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)

    await destinationWindow.click()
    await page.keyboard.press('Backspace')
    await expect(destinationWindow).toHaveCount(0)
    await expect(getWindows(page)).toHaveCount(1)
    await dismissNotifications(page)

    const firstTab = getTab(page, titles[0]!)
    const secondTab = getTab(page, titles[1]!)
    await firstTab.click()
    await secondTab.click({ modifiers: ['Meta'] })
    await expect(getSelected(page, 'tab')).toHaveCount(2)
    await page.keyboard.press('Backspace')
    await expect(firstTab).toHaveCount(0)
    await expect(secondTab).toHaveCount(0)
    const keyboardCloseNotification = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: '2 tabs closed' })
    await expect(keyboardCloseNotification).toBeVisible()
    await dismissNotifications(page)

    await expect
      .poll(() =>
        page.evaluate(
          async (windowId) => (await chrome.tabs.query({ windowId })).length,
          sourceWindowId,
        ),
      )
      .toBe(3)
  })
})
