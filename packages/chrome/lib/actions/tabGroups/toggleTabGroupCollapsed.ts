import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Toggles the collapsed state of a tab group.
 */
export const toggleTabGroupCollapsed = async (
  groupId: BrowserTabGroupID,
  currentCollapsed: boolean,
): Promise<void> => {
  await chrome.tabGroups.update(groupId, { collapsed: !currentCollapsed })
}
