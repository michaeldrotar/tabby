import {
  pinTab,
  unpinTab,
  muteTab,
  unmuteTab,
  duplicateTab,
  reloadTab,
  closeTab,
  closeOtherTabs,
  closeTabsAfter,
  copyTabUrl,
  copyTabTitle,
  copyTabTitleAndUrl,
  addTabToGroup,
  addTabToNewGroup,
  removeTabFromGroup,
  moveTabToWindow,
  moveTabToNewWindow,
  moveTabBackward,
  moveTabForward,
} from '@extension/chrome'
import { useCallback, useMemo } from 'react'
import type { BrowserTab } from '@extension/chrome'

/**
 * Actions for managing individual tabs via context menu.
 * All actions are async and handle errors gracefully.
 */
export const useTabActions = (tab: BrowserTab) => {
  const { id: tabId, windowId } = tab
  const pin = useCallback(async () => {
    await pinTab(tabId)
  }, [tabId])

  const unpin = useCallback(async () => {
    await unpinTab(tabId)
  }, [tabId])

  const mute = useCallback(async () => {
    await muteTab(tabId)
  }, [tabId])

  const unmute = useCallback(async () => {
    await unmuteTab(tabId)
  }, [tabId])

  const duplicate = useCallback(async () => {
    await duplicateTab(tabId)
  }, [tabId])

  const reload = useCallback(async () => {
    await reloadTab(tabId)
  }, [tabId])

  const close = useCallback(async () => {
    await closeTab(tabId)
  }, [tabId])

  const closeOther = useCallback(async () => {
    await closeOtherTabs(tabId, windowId)
  }, [tabId, windowId])

  const closeAfter = useCallback(async () => {
    await closeTabsAfter(tabId, windowId)
  }, [tabId, windowId])

  const moveBack = useCallback(() => moveTabBackward(tabId), [tabId])

  const moveForward = useCallback(() => moveTabForward(tabId), [tabId])

  const copyUrl = useCallback(async () => {
    await copyTabUrl(tabId)
  }, [tabId])

  const copyTitle = useCallback(async () => {
    await copyTabTitle(tabId)
  }, [tabId])

  const copyTitleAndUrl = useCallback(async () => {
    await copyTabTitleAndUrl(tabId)
  }, [tabId])

  const addToGroup = useCallback(
    async (groupId: number) => {
      await addTabToGroup(tabId, groupId)
    },
    [tabId],
  )

  const addToNewGroup = useCallback(async () => {
    await addTabToNewGroup(tabId)
  }, [tabId])

  const removeFromGroup = useCallback(async () => {
    await removeTabFromGroup(tabId)
  }, [tabId])

  const moveToWindow = useCallback(
    async (targetWindowId: number) => {
      await moveTabToWindow(tabId, targetWindowId)
    },
    [tabId],
  )

  const moveToNewWindow = useCallback(async () => {
    await moveTabToNewWindow(tabId)
  }, [tabId])

  return useMemo(
    () => ({
      pin,
      unpin,
      mute,
      unmute,
      duplicate,
      reload,
      close,
      closeOther,
      closeAfter,
      copyUrl,
      copyTitle,
      copyTitleAndUrl,
      addToGroup,
      addToNewGroup,
      removeFromGroup,
      moveToWindow,
      moveToNewWindow,
      moveBack,
      moveForward,
    }),
    [
      pin,
      unpin,
      mute,
      unmute,
      duplicate,
      reload,
      close,
      closeOther,
      closeAfter,
      copyUrl,
      copyTitle,
      copyTitleAndUrl,
      addToGroup,
      addToNewGroup,
      removeFromGroup,
      moveToWindow,
      moveToNewWindow,
      moveBack,
      moveForward,
    ],
  )
}
