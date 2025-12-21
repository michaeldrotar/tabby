import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a tab becomes active in a window.
 */
const onChromeTabActivated = (
  activeInfo: chrome.tabs.OnActivatedInfo,
): void => {
  const { tabId, windowId } = activeInfo
  const state = useBrowserStore.getState()

  const windowBrowserTabs = Object.values(state.tabById).filter(
    (tab) => tab.windowId === windowId,
  )
  const activeBrowserTab = windowBrowserTabs.find((tab) => tab.active)
  if (activeBrowserTab && activeBrowserTab.id !== tabId) {
    state.updateTabById(activeBrowserTab.id, { active: false })
  }

  const activatedBrowserTab = state.tabById[tabId]
  if (activatedBrowserTab && !activatedBrowserTab.active) {
    state.updateTabById(activatedBrowserTab.id, { active: true })
  }
}

/**
 * Handles when a chrome tab is attached to a window.
 *
 * When a tab is attached at a position, all existing tabs at that position
 * or higher need to have their indexes shifted up by 1.
 */
const onChromeTabAttached = (
  tabId: number,
  attachInfo: chrome.tabs.OnAttachedInfo,
): void => {
  const state = useBrowserStore.getState()
  const { newWindowId, newPosition } = attachInfo

  // Shift indexes of existing tabs in the target window that are at or after the new position
  const tabsToShift = Object.values(state.tabById).filter(
    (tab) =>
      tab.windowId === newWindowId &&
      tab.id !== tabId &&
      tab.index >= newPosition,
  )

  for (const tab of tabsToShift) {
    state.updateTabById(tab.id, { index: tab.index + 1 })
  }

  // Update the attached tab's window and position
  state.updateTabById(tabId, {
    windowId: newWindowId,
    index: newPosition,
  })
}

/**
 * Handles when a new chrome tab is created.
 */
const onChromeTabCreated = (newChromeTab: chrome.tabs.Tab): void => {
  const newBrowserTab = toBrowserTab(newChromeTab)
  if (!newBrowserTab) return
  const state = useBrowserStore.getState()
  state.addTab(newBrowserTab)
}

/**
 * Handles when a chrome tab is detached from its window.
 *
 * When a tab is detached from a position, all tabs after that position
 * need to have their indexes shifted down by 1.
 */
const onChromeTabDetached = (
  tabId: number,
  detachInfo: chrome.tabs.OnDetachedInfo,
): void => {
  const state = useBrowserStore.getState()
  const { oldWindowId, oldPosition } = detachInfo

  // Shift indexes of tabs in the old window that were after the detached position
  const tabsToShift = Object.values(state.tabById).filter(
    (tab) =>
      tab.windowId === oldWindowId &&
      tab.id !== tabId &&
      tab.index > oldPosition,
  )

  for (const tab of tabsToShift) {
    state.updateTabById(tab.id, { index: tab.index - 1 })
  }

  // Mark the tab as detached (windowId = WINDOW_ID_NONE)
  state.updateTabById(tabId, {
    windowId: chrome.windows.WINDOW_ID_NONE,
    index: oldPosition,
  })
}

/**
 * Handles when the highlighted tab selection changes within a window.
 */
const onChromeTabHighlighted = (
  highlightInfo: chrome.tabs.OnHighlightedInfo,
): void => {
  const state = useBrowserStore.getState()
  const { tabIds, windowId } = highlightInfo
  const windowTabs = Object.values(state.tabById).filter(
    (tab) => tab.windowId === windowId,
  )
  if (!windowTabs || windowTabs.length === 0) return

  const highlightedTabIds = new Set(tabIds)
  windowTabs.forEach((tab) => {
    const shouldBeHighlighted = highlightedTabIds.has(tab.id)
    if (tab.highlighted !== shouldBeHighlighted) {
      state.updateTabById(tab.id, { highlighted: shouldBeHighlighted })
    }
  })
}

/**
 * Handles when a chrome tab is moved within a window.
 */
const onChromeTabMoved = (
  tabId: number,
  moveInfo: chrome.tabs.OnMovedInfo,
): void => {
  const state = useBrowserStore.getState()
  state.moveTabById(tabId, { toIndex: moveInfo.toIndex })
}

/**
 * Handles when a chrome tab is removed.
 */
const onChromeTabRemoved = (
  removedTabId: number,
  removeInfo: chrome.tabs.OnRemovedInfo,
): void => {
  const state = useBrowserStore.getState()
  state.removeTabById(removedTabId, removeInfo)
}

/**
 * Handles when a chrome tab is replaced by another tab (prerender, etc.).
 */
const onChromeTabReplaced = (
  addedTabId: number,
  removedTabId: number,
): void => {
  void chrome.tabs
    .get(addedTabId)
    .then((newChromeTab) => {
      const newBrowserTab = toBrowserTab(newChromeTab)
      if (!newBrowserTab) return

      const state = useBrowserStore.getState()
      state.removeTabById(removedTabId)
      state.addTab(newBrowserTab)
    })
    .catch((error) => {
      console.error('Failed to handle tab replacement', addedTabId, error)
    })
}

/**
 * Handles when a chrome tab is updated.
 */
const onChromeTabUpdated = (
  tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
): void => {
  const browserTab = toBrowserTab(tab)
  if (!browserTab) return

  const state = useBrowserStore.getState()
  state.updateTabById(tabId, changeInfo)
}

/**
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser tabs.
 */
export const registerChromeTabEventHandlers = (): void => {
  chrome.tabs.onActivated.addListener(onChromeTabActivated)
  chrome.tabs.onAttached.addListener(onChromeTabAttached)
  chrome.tabs.onCreated.addListener(onChromeTabCreated)
  chrome.tabs.onDetached.addListener(onChromeTabDetached)
  chrome.tabs.onHighlighted.addListener(onChromeTabHighlighted)
  chrome.tabs.onMoved.addListener(onChromeTabMoved)
  chrome.tabs.onRemoved.addListener(onChromeTabRemoved)
  chrome.tabs.onReplaced.addListener(onChromeTabReplaced)
  chrome.tabs.onUpdated.addListener(onChromeTabUpdated)
}

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
export const unregisterChromeTabEventHandlers = (): void => {
  chrome.tabs.onActivated.removeListener(onChromeTabActivated)
  chrome.tabs.onAttached.removeListener(onChromeTabAttached)
  chrome.tabs.onCreated.removeListener(onChromeTabCreated)
  chrome.tabs.onDetached.removeListener(onChromeTabDetached)
  chrome.tabs.onHighlighted.removeListener(onChromeTabHighlighted)
  chrome.tabs.onMoved.removeListener(onChromeTabMoved)
  chrome.tabs.onRemoved.removeListener(onChromeTabRemoved)
  chrome.tabs.onReplaced.removeListener(onChromeTabReplaced)
  chrome.tabs.onUpdated.removeListener(onChromeTabUpdated)
}
