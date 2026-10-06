import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Closes multiple tabs by their IDs.
 */
export const closeTabs = async (
  tabIds: readonly BrowserTabID[],
): Promise<void> => {
  if (tabIds.length > 0) {
    await chrome.tabs.remove([...tabIds])
  }
}
