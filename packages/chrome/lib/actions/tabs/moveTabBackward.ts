import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Moves a tab backward (up in the visual list).
 * - If at first position in group: ungroups without moving
 * - If adjacent to a group above: joins that group at the end
 * - Otherwise: moves up by one position
 */
export const moveTabBackward = async (tabId: BrowserTabID): Promise<void> => {
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
