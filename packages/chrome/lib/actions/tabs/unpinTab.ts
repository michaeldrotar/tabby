import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Unpins a tab by ID.
 */
export const unpinTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.update(tabId, { pinned: false })
}
