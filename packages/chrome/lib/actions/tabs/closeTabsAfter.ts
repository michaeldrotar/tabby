import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Closes all tabs after the specified tab in the window.
 * Pinned tabs are not closed.
 */
export const closeTabsAfter = async (
  tabId: BrowserTabID,
  windowId: BrowserWindowID,
): Promise<void> => {
  const allTabs = await chrome.tabs.query({ windowId })
  const currentIndex = allTabs.findIndex((t) => t.id === tabId)
  const afterTabIds = allTabs
    .slice(currentIndex + 1)
    .filter((t) => !t.pinned)
    .map((t) => t.id)
    .filter((id): id is number => id !== undefined)
  if (afterTabIds.length > 0) {
    await chrome.tabs.remove(afterTabIds)
  }
}
