import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Moves a group forward (down in the visual list).
 * - If adjacent to another group: moves after that entire group
 * - Otherwise: moves down by one position
 */
export const moveTabGroupForward = async (
  groupId: BrowserTabGroupID,
): Promise<void> => {
  const group = await chrome.tabGroups.get(groupId)
  const groupTabs = await chrome.tabs.query({ groupId })
  if (groupTabs.length === 0) return

  const minIndex = Math.min(...groupTabs.map((t) => t.index))
  const maxIndex = Math.max(...groupTabs.map((t) => t.index))

  const allTabs = await chrome.tabs.query({ windowId: group.windowId })
  allTabs.sort((a, b) => a.index - b.index)

  const tabAfter = allTabs.find((t) => t.index === maxIndex + 1)
  if (!tabAfter) return

  if (tabAfter.groupId !== undefined && tabAfter.groupId !== -1) {
    const otherGroupTabs = allTabs.filter((t) => t.groupId === tabAfter.groupId)
    const otherGroupEnd = Math.max(...otherGroupTabs.map((t) => t.index))
    const newIndex = minIndex + (otherGroupEnd - maxIndex)
    await chrome.tabGroups.move(groupId, { index: newIndex })
  } else {
    await chrome.tabGroups.move(groupId, { index: minIndex + 1 })
  }
}
