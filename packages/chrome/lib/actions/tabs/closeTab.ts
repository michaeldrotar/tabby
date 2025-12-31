import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Closes a tab by ID.
 */
export const closeTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.remove(tabId)
}
