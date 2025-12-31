import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Renames a tab group.
 */
export const renameTabGroup = async (
  groupId: BrowserTabGroupID,
  title: string,
): Promise<void> => {
  await chrome.tabGroups.update(groupId, { title })
}
