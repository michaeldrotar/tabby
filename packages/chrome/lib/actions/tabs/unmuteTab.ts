import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Unmutes a tab by ID.
 */
export const unmuteTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.update(tabId, { muted: false })
}
