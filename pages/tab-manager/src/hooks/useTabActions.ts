import { addTabToGroup } from '@extension/chrome/actions/tabs/addTabToGroup'
import { addTabToNewGroup } from '@extension/chrome/actions/tabs/addTabToNewGroup'
import { closeOtherTabs } from '@extension/chrome/actions/tabs/closeOtherTabs'
import { closeTab } from '@extension/chrome/actions/tabs/closeTab'
import { closeTabsAfter } from '@extension/chrome/actions/tabs/closeTabsAfter'
import { copyTabTitle } from '@extension/chrome/actions/tabs/copyTabTitle'
import { copyTabTitleAndUrl } from '@extension/chrome/actions/tabs/copyTabTitleAndUrl'
import { copyTabUrl } from '@extension/chrome/actions/tabs/copyTabUrl'
import { duplicateTab } from '@extension/chrome/actions/tabs/duplicateTab'
import { moveTabBackward } from '@extension/chrome/actions/tabs/moveTabBackward'
import { moveTabForward } from '@extension/chrome/actions/tabs/moveTabForward'
import { moveTabToNewWindow } from '@extension/chrome/actions/tabs/moveTabToNewWindow'
import { moveTabToWindow } from '@extension/chrome/actions/tabs/moveTabToWindow'
import { muteTab } from '@extension/chrome/actions/tabs/muteTab'
import { pinTab } from '@extension/chrome/actions/tabs/pinTab'
import { reloadTab } from '@extension/chrome/actions/tabs/reloadTab'
import { removeTabFromGroup } from '@extension/chrome/actions/tabs/removeTabFromGroup'
import { unmuteTab } from '@extension/chrome/actions/tabs/unmuteTab'
import { unpinTab } from '@extension/chrome/actions/tabs/unpinTab'
import { t } from '@extension/i18n/t'
import { toast } from '@extension/ui/components/Toaster'
import { useCallback, useMemo } from 'react'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserTabGroupID } from '@extension/chrome/tabGroup/BrowserTabGroupID'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'

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
