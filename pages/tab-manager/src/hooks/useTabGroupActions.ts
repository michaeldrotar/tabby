import { changeTabGroupColor } from '@extension/chrome/actions/tabGroups/changeTabGroupColor'
import { copyTabGroupUrls } from '@extension/chrome/actions/tabGroups/copyTabGroupUrls'
import { moveTabGroupBackward } from '@extension/chrome/actions/tabGroups/moveTabGroupBackward'
import { moveTabGroupForward } from '@extension/chrome/actions/tabGroups/moveTabGroupForward'
import { moveTabGroupToNewWindow } from '@extension/chrome/actions/tabGroups/moveTabGroupToNewWindow'
import { renameTabGroup } from '@extension/chrome/actions/tabGroups/renameTabGroup'
import { toggleTabGroupCollapsed } from '@extension/chrome/actions/tabGroups/toggleTabGroupCollapsed'
import { closeTabs } from '@extension/chrome/actions/tabs/closeTabs'
import { ungroupTabs } from '@extension/chrome/actions/tabs/ungroupTabs'
import { tt } from '@extension/i18n/plurals'
import { toast } from '@extension/ui/components/Toaster'
import { useCallback, useMemo } from 'react'
import type { BrowserTabID } from '@extension/chrome/tab/BrowserTabID'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
} from '@extension/chrome/tabGroup/BrowserTabGroup'

/**
 * Actions for managing tab groups via context menu.
 * Includes toast feedback for copy operations and bulk actions.
 */
export const useTabGroupActions = (
  group: BrowserTabGroup,
  tabIds: readonly BrowserTabID[],
) => {
  const { id: groupId, collapsed } = group

  const changeColor = useCallback(
    (color: BrowserTabGroupColor) => changeTabGroupColor(groupId, color),
    [groupId],
  )
  const close = useCallback(async () => {
    const count = tabIds.length
    await closeTabs(tabIds)
    toast.success(tt('toast_nTabsClosed', count))
  }, [tabIds])
  const copyUrls = useCallback(async () => {
    await copyTabGroupUrls(groupId)
    toast.success(tt('toast_nUrlsCopied', tabIds.length))
  }, [groupId, tabIds.length])
  const moveBack = useCallback(() => moveTabGroupBackward(groupId), [groupId])
  const moveForward = useCallback(() => moveTabGroupForward(groupId), [groupId])
  const moveToNewWindow = useCallback(
    () => moveTabGroupToNewWindow(groupId),
    [groupId],
  )
  const rename = useCallback(
    (title: string) => renameTabGroup(groupId, title),
    [groupId],
  )
  const toggleCollapse = useCallback(
    () => toggleTabGroupCollapsed(groupId, collapsed),
    [groupId, collapsed],
  )
  const ungroup = useCallback(() => ungroupTabs(tabIds), [tabIds])

  return useMemo(
    () => ({
      changeColor,
      close,
      copyUrls,
      moveBack,
      moveForward,
      moveToNewWindow,
      rename,
      toggleCollapse,
      ungroup,
    }),
    [
      changeColor,
      close,
      copyUrls,
      moveBack,
      moveForward,
      moveToNewWindow,
      rename,
      toggleCollapse,
      ungroup,
    ],
  )
}
