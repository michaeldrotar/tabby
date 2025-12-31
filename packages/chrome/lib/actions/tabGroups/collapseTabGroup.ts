import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Collapses a tab group by ID.
 */
export const collapseTabGroup = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  await chrome.tabGroups.update(groupId, { collapsed: true })
}
