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
import { useCallback, useMemo } from 'react'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
  BrowserTabID,
} from '@extension/chrome'

/**
 * Actions for managing tab groups via context menu.
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
  const close = useCallback(() => closeTabs(tabIds), [tabIds])
  const copyUrls = useCallback(() => copyTabGroupUrls(groupId), [groupId])
  const moveBack = useCallback(() => moveTabGroupBackward(groupId), [groupId])
  const moveForward = useCallback(() => moveTabGroupForward(groupId), [groupId])
  const moveToNewWindow = useCallback(
    () => moveTabGroupToNewWindow(tabIds),
    [tabIds],
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
