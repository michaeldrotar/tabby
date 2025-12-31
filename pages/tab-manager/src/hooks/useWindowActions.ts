import {
  focusWindow,
  closeWindow,
  muteAllTabsInWindow,
  unmuteAllTabsInWindow,
  reloadAllTabsInWindow,
  copyAllUrlsInWindow,
} from '@extension/chrome'
import { useCallback } from 'react'
import type { BrowserWindow, BrowserTab } from '@extension/chrome'

/**
 * Actions for managing browser windows via context menu.
 * All actions are async and handle errors gracefully.
 */
export const useWindowActions = (window: BrowserWindow, tabs: BrowserTab[]) => {
  const windowId = window.id
  const tabIds = tabs.map((t) => t.id)

  const focus = useCallback(async () => {
    await focusWindow(windowId)
  }, [windowId])

  const muteAll = useCallback(async () => {
    await muteAllTabsInWindow(tabIds)
  }, [tabIds])

  const unmuteAll = useCallback(async () => {
    await unmuteAllTabsInWindow(tabIds)
  }, [tabIds])

  const reloadAll = useCallback(async () => {
    await reloadAllTabsInWindow(tabIds)
  }, [tabIds])

  const copyAllUrls = useCallback(async () => {
    await copyAllUrlsInWindow(tabs)
  }, [tabs])

  const close = useCallback(async () => {
    await closeWindow(windowId)
  }, [windowId])

  return {
    focus,
    muteAll,
    unmuteAll,
    reloadAll,
    copyAllUrls,
    close,
  }
}
