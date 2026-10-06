import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Closes all other tabs in the window except the specified tab.
 * Pinned tabs are not closed.
 */
export const closeOtherTabs = async (
  tabId: BrowserTabID,
  windowId: BrowserWindowID,
): Promise<void> => {
  const allTabs = await chrome.tabs.query({ windowId })
  const otherTabIds = allTabs
    .filter((t) => t.id !== tabId && !t.pinned)
    .map((t) => t.id)
    .filter((id): id is number => id !== undefined)
  if (otherTabIds.length > 0) {
    await chrome.tabs.remove(otherTabIds)
  }
}
