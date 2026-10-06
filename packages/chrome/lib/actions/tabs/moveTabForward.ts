import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Moves a tab forward (down in the visual list).
 * - If at last position in group: ungroups without moving
 * - If adjacent to a group below: joins that group at the beginning
 * - Otherwise: moves down by one position
 */
export const moveTabForward = async (tabId: BrowserTabID): Promise<void> => {
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
