import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Moves a tab group to a new window.
 * Creates a new window with the first tab, then moves the rest and recreates the group.
 */
export const moveTabGroupToNewWindow = async (
  tabIds: readonly BrowserTabID[],
): Promise<void> => {
  const firstTabId = tabIds[0]
  if (firstTabId !== undefined) {
    const restTabIds = tabIds.slice(1)
    const newWindow = await chrome.windows.create({ tabId: firstTabId })
    if (newWindow?.id && restTabIds.length > 0) {
      await chrome.tabs.move(restTabIds as number[], {
        windowId: newWindow.id as BrowserWindowID,
        index: -1,
      })
      // Re-create the group in the new window
      await chrome.tabs.group({
        tabIds: [firstTabId, ...restTabIds],
        createProperties: { windowId: newWindow.id },
      })
    }
  }
}
