import { useBrowserStore } from '../../useBrowserStore.js'
import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
  Updates a tab group.

  Updates in chrome's UI trigger tabGroups.onUpdated event,
  but tabGroups.update does not currently. It's probably a bug. But we need
  to update storage since we can't rely on the event update.
 */
export const updateTabGroup = async (
  groupId: BrowserTabGroupID,
  updateProperties: chrome.tabGroups.UpdateProperties,
): Promise<chrome.tabGroups.TabGroup | undefined> => {
  const newTabGroup = await chrome.tabGroups.update(groupId, updateProperties)

  if (!newTabGroup) {
    console.warn(
      `Tried to update tab group ${groupId}, but it did not return a new tab group.`,
    )
    return
  }

  const state = useBrowserStore.getState()
  state.updateTabGroupById(newTabGroup.id, newTabGroup)
  return newTabGroup
}
