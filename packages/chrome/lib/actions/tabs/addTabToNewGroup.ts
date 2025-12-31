import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Adds a tab to a new group.
 */
export const addTabToNewGroup = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.group({ tabIds: tabId })
}
