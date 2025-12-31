import {
  toggleTabGroupCollapsed,
  renameTabGroup,
  changeTabGroupColor,
  ungroupTabs,
  copyTabGroupUrls,
  moveTabGroupToNewWindow,
  moveTabGroupBackward,
  moveTabGroupForward,
  closeTabs,
} from '@extension/chrome'
import { useCallback, useMemo } from 'react'
import type {
  BrowserTabGroupColor,
  BrowserTabGroup,
  BrowserTabID,
} from '@extension/chrome'

/**
 * Actions for managing tab groups via context menu.
 * All actions are async and handle errors gracefully.
 */
export const useTabGroupActions = (
  group: BrowserTabGroup,
  tabIds: readonly BrowserTabID[],
) => {
  const { id: groupId, collapsed } = group

  const toggleCollapse = useCallback(async () => {
    await toggleTabGroupCollapsed(groupId, collapsed)
  }, [groupId, collapsed])

  const rename = useCallback(
    async (title: string) => {
      await renameTabGroup(groupId, title)
    },
    [groupId],
  )

  const changeColor = useCallback(
    async (color: BrowserTabGroupColor) => {
      await changeTabGroupColor(groupId, color)
    },
    [groupId],
  )

  const ungroup = useCallback(async () => {
    await ungroupTabs(tabIds)
  }, [tabIds])

  const copyUrls = useCallback(async () => {
    await copyTabGroupUrls(groupId)
  }, [groupId])

  const moveToNewWindow = useCallback(async () => {
    await moveTabGroupToNewWindow(tabIds)
  }, [tabIds])

  const moveBack = useCallback(() => moveTabGroupBackward(groupId), [groupId])

  const moveForward = useCallback(() => moveTabGroupForward(groupId), [groupId])

  const close = useCallback(async () => {
    await closeTabs(tabIds)
  }, [tabIds])

  return useMemo(
    () => ({
      toggleCollapse,
      rename,
      changeColor,
      ungroup,
      copyUrls,
      moveToNewWindow,
      moveBack,
      moveForward,
      close,
    }),
    [
      toggleCollapse,
      rename,
      changeColor,
      ungroup,
      copyUrls,
      moveToNewWindow,
      moveBack,
      moveForward,
      close,
    ],
  )
}
