import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Reloads a tab by ID.
 */
export const reloadTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.reload(tabId)
}
