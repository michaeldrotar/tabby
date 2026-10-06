import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Mutes a tab by ID.
 */
export const muteTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.update(tabId, { muted: true })
}
