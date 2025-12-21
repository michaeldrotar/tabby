/**
 * Shared move operations for tabs and groups.
 * Used by useTabActions, useTabGroupActions, and useKeyboardNavigation.
 */

/**
 * Moves a tab backward (up in the visual list).
 * - If at first position in group: ungroups without moving
 * - If adjacent to a group above: joins that group at the end
 * - Otherwise: moves up by one position
 */
export const moveTabBack = async (tabId: number): Promise<void> => {
  const tab = await chrome.tabs.get(tabId)
  if (!tab || tab.id === undefined) return

  const allTabs = await chrome.tabs.query({ windowId: tab.windowId })
  allTabs.sort((a, b) => a.index - b.index)

  const isInGroup = tab.groupId !== undefined && tab.groupId !== -1

  if (isInGroup) {
    const groupTabs = allTabs.filter((t) => t.groupId === tab.groupId)
    const isFirstInGroup =
      tab.index === Math.min(...groupTabs.map((t) => t.index))

    if (isFirstInGroup) {
      await chrome.tabs.ungroup(tab.id)
    } else {
      await chrome.tabs.move(tab.id, { index: tab.index - 1 })
    }
  } else {
    const tabAbove = allTabs.find((t) => t.index === tab.index - 1)
    if (tabAbove && tabAbove.groupId !== undefined && tabAbove.groupId !== -1) {
      await chrome.tabs.group({ tabIds: tab.id, groupId: tabAbove.groupId })
    } else {
      const newIndex = Math.max(0, tab.index - 1)
      if (newIndex !== tab.index) {
        await chrome.tabs.move(tab.id, { index: newIndex })
      }
    }
  }
}

/**
 * Moves a tab forward (down in the visual list).
 * - If at last position in group: ungroups without moving
 * - If adjacent to a group below: joins that group at the beginning
 * - Otherwise: moves down by one position
 */
export const moveTabForward = async (tabId: number): Promise<void> => {
  const tab = await chrome.tabs.get(tabId)
  if (!tab || tab.id === undefined) return

  const allTabs = await chrome.tabs.query({ windowId: tab.windowId })
  allTabs.sort((a, b) => a.index - b.index)

  const isInGroup = tab.groupId !== undefined && tab.groupId !== -1

  if (isInGroup) {
    const groupTabs = allTabs.filter((t) => t.groupId === tab.groupId)
    const isLastInGroup =
      tab.index === Math.max(...groupTabs.map((t) => t.index))

    if (isLastInGroup) {
      await chrome.tabs.ungroup(tab.id)
    } else {
      await chrome.tabs.move(tab.id, { index: tab.index + 1 })
    }
  } else {
    const tabBelow = allTabs.find((t) => t.index === tab.index + 1)
    if (tabBelow && tabBelow.groupId !== undefined && tabBelow.groupId !== -1) {
      await chrome.tabs.group({ tabIds: tab.id, groupId: tabBelow.groupId })
    } else {
      await chrome.tabs.move(tab.id, { index: tab.index + 1 })
    }
  }
}

/**
 * Moves a group backward (up in the visual list).
 * - If adjacent to another group: moves before that entire group
 * - Otherwise: moves up by one position
 */
export const moveGroupBack = async (groupId: number): Promise<void> => {
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

/**
 * Moves a group forward (down in the visual list).
 * - If adjacent to another group: moves after that entire group
 * - Otherwise: moves down by one position
 */
export const moveGroupForward = async (groupId: number): Promise<void> => {
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
