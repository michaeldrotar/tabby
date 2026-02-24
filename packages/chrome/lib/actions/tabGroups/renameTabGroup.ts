import { updateTabGroup } from './updateTabGroup.js'
import type { BrowserTabGroupID } from '../../tabGroup/BrowserTabGroupID.js'

/**
 * Renames a tab group.
 */
export const renameTabGroup = async (
  groupId: BrowserTabGroupID,
  title: string,
): Promise<void> => {
  await updateTabGroup(groupId, { title })
}
