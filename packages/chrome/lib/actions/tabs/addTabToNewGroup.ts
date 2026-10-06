import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'
import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Adds a tab to a new group.
 */
export const addTabToNewGroup = async (
  tabId: BrowserTabID,
  windowId?: BrowserWindowID,
): Promise<BrowserTabGroupID> => {
  const groupId = await chrome.tabs.group({
    tabIds: tabId,
    ...(windowId === undefined ? {} : { createProperties: { windowId } }),
  })
  return groupId as BrowserTabGroupID
}
