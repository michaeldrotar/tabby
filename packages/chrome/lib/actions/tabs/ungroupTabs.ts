import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Removes multiple tabs from their groups (ungroups them).
 */
export const ungroupTabs = async (
  tabIds: readonly BrowserTabID[],
): Promise<void> => {
  if (tabIds.length > 0) {
    await chrome.tabs.ungroup(tabIds as [number, ...number[]])
  }
}
