import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Adds a tab to an existing group.
 */
export const addTabToGroup = async (
  tabId: BrowserTabID,
  groupId: BrowserTabGroupID,
): Promise<void> => {
  await chrome.tabs.group({ tabIds: tabId, groupId })
}
