import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Pins a tab by ID.
 */
export const pinTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.update(tabId, { pinned: true })
}
