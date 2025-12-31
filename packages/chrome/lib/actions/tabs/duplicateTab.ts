import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Duplicates a tab by ID.
 */
export const duplicateTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.duplicate(tabId)
}
