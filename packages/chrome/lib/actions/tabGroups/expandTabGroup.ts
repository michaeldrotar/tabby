import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Expands a tab group by ID.
 */
export const expandTabGroup = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  await chrome.tabGroups.update(groupId, { collapsed: false })
}
