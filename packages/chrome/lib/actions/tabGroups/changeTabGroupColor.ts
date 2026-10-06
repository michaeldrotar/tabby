import { updateTabGroup } from './updateTabGroup.js'
import type { BrowserTabGroupColor } from '../../tabGroup/BrowserTabGroup.js'
import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Changes the color of a tab group.
 */
export const changeTabGroupColor = async (
  groupId: BrowserTabGroupID,
  color: BrowserTabGroupColor,
): Promise<void> => {
  await updateTabGroup(groupId, { color })
}
