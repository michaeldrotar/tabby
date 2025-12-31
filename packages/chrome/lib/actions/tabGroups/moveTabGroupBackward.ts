import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Moves a group backward (up in the visual list).
 * - If adjacent to another group: moves before that entire group
 * - Otherwise: moves up by one position
 */
export const moveTabGroupBackward = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  const group = await chrome.tabGroups.get(groupId)
  const groupTabs = await chrome.tabs.query({ groupId })
  if (groupTabs.length === 0) return

  const minIndex = Math.min(...groupTabs.map((t) => t.index))
  if (minIndex === 0) return

  const allTabs = await chrome.tabs.query({ windowId: group.windowId })
  allTabs.sort((a, b) => a.index - b.index)

  const tabBefore = allTabs.find((t) => t.index === minIndex - 1)
  if (
    tabBefore &&
    tabBefore.groupId !== undefined &&
    tabBefore.groupId !== -1
  ) {
    const otherGroupTabs = allTabs.filter(
      (t) => t.groupId === tabBefore.groupId,
    )
    const otherGroupStart = Math.min(...otherGroupTabs.map((t) => t.index))
    await chrome.tabGroups.move(groupId, { index: otherGroupStart })
  } else {
    await chrome.tabGroups.move(groupId, { index: minIndex - 1 })
  }
}
