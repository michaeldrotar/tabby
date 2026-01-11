import {
  addTabToGroup,
  addTabToNewGroup,
  closeOtherTabs,
  closeTab,
  closeTabsAfter,
  copyTabTitle,
  copyTabTitleAndUrl,
  copyTabUrl,
  duplicateTab,
  moveTabBackward,
  moveTabForward,
  moveTabToNewWindow,
  moveTabToWindow,
  muteTab,
  pinTab,
  reloadTab,
  removeTabFromGroup,
  unmuteTab,
  unpinTab,
} from '@extension/chrome'
import { t } from '@extension/i18n'
import { toast } from '@extension/ui'
import { useCallback, useMemo } from 'react'
import type {
  BrowserTab,
  BrowserTabGroupID,
  BrowserWindowID,
} from '@extension/chrome'

/**
 * Actions for managing individual tabs via context menu.
 * Includes toast feedback for copy operations and bulk actions.
 */
export const useTabActions = (tab: BrowserTab) => {
  const { id: tabId, windowId } = tab

  const addToGroup = useCallback(
    (groupId: BrowserTabGroupID) => addTabToGroup(tabId, groupId),
    [tabId],
  )
  const addToNewGroup = useCallback(() => addTabToNewGroup(tabId), [tabId])
  const close = useCallback(() => closeTab(tabId), [tabId])
  const closeAfter = useCallback(
    () => closeTabsAfter(tabId, windowId),
    [tabId, windowId],
  )
  const closeOther = useCallback(
    () => closeOtherTabs(tabId, windowId),
    [tabId, windowId],
  )
  const copyTitle = useCallback(async () => {
    await copyTabTitle(tabId)
    toast.success(t('toast_titleCopied'))
  }, [tabId])
  const copyTitleAndUrl = useCallback(async () => {
    await copyTabTitleAndUrl(tabId)
    toast.success(t('toast_titleAndUrlCopied'))
  }, [tabId])
  const copyUrl = useCallback(async () => {
    await copyTabUrl(tabId)
    toast.success(t('toast_urlCopied'))
  }, [tabId])
  const duplicate = useCallback(() => duplicateTab(tabId), [tabId])
  const moveBack = useCallback(() => moveTabBackward(tabId), [tabId])
  const moveForward = useCallback(() => moveTabForward(tabId), [tabId])
  const moveToNewWindow = useCallback(() => moveTabToNewWindow(tabId), [tabId])
  const moveToWindow = useCallback(
    (targetWindowId: BrowserWindowID) => moveTabToWindow(tabId, targetWindowId),
    [tabId],
  )
  const mute = useCallback(() => muteTab(tabId), [tabId])
  const pin = useCallback(() => pinTab(tabId), [tabId])
  const reload = useCallback(() => reloadTab(tabId), [tabId])
  const removeFromGroup = useCallback(() => removeTabFromGroup(tabId), [tabId])
  const unmute = useCallback(() => unmuteTab(tabId), [tabId])
  const unpin = useCallback(() => unpinTab(tabId), [tabId])

  return useMemo(
    () => ({
      addToGroup,
      addToNewGroup,
      close,
      closeAfter,
      closeOther,
      copyTitle,
      copyTitleAndUrl,
      copyUrl,
      duplicate,
      moveBack,
      moveForward,
      moveToNewWindow,
      moveToWindow,
      mute,
      pin,
      reload,
      removeFromGroup,
      unmute,
      unpin,
    }),
    [
      addToGroup,
      addToNewGroup,
      close,
      closeAfter,
      closeOther,
      copyTitle,
      copyTitleAndUrl,
      copyUrl,
      duplicate,
      moveBack,
      moveForward,
      moveToNewWindow,
      moveToWindow,
      mute,
      pin,
      reload,
      removeFromGroup,
      unmute,
      unpin,
    ],
  )
}
