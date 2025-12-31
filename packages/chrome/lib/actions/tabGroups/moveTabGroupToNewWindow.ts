import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Moves a tab group to a new window.
 * Creates a new window, moves the entire group to it (preserving name and color),
 * then closes the blank tab that was created with the new window.
 */
export const moveTabGroupToNewWindow = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  const newWindow = await chrome.windows.create({})
  if (!newWindow?.id) return

  const blankTabId = newWindow.tabs?.[0]?.id

  await chrome.tabGroups.move(groupId, { windowId: newWindow.id, index: -1 })

  if (blankTabId) {
    await chrome.tabs.remove(blankTabId)
  }
}
