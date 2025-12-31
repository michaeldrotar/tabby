import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Removes a tab from its group (ungroups it).
 */
export const removeTabFromGroup = async (
  tabId: BrowserTabID,
): Promise<void> => {
  await chrome.tabs.ungroup(tabId)
}
