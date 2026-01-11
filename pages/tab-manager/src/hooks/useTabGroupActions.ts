import {
  changeTabGroupColor,
  closeTabs,
  copyTabGroupUrls,
  moveTabGroupBackward,
  moveTabGroupForward,
  moveTabGroupToNewWindow,
  renameTabGroup,
  toggleTabGroupCollapsed,
  ungroupTabs,
} from '@extension/chrome'
import { tt } from '@extension/i18n'
import { toast } from '@extension/ui'
import { useCallback, useMemo } from 'react'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
  BrowserTabID,
} from '@extension/chrome'

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
