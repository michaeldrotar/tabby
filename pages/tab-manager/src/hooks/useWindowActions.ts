import {
  closeWindow,
  copyAllUrlsInWindow,
  focusWindow,
  muteAllTabsInWindow,
  reloadAllTabsInWindow,
  unmuteAllTabsInWindow,
} from '@extension/chrome'
import { useCallback, useMemo } from 'react'
import type { BrowserTab, BrowserWindow } from '@extension/chrome'

/**
 * Actions for managing browser windows via context menu.
 */
export const useWindowActions = (window: BrowserWindow, tabs: BrowserTab[]) => {
  const windowId = window.id
  const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs])

  const close = useCallback(() => closeWindow(windowId), [windowId])
  const copyAllUrls = useCallback(() => copyAllUrlsInWindow(tabs), [tabs])
  const focus = useCallback(() => focusWindow(windowId), [windowId])
  const muteAll = useCallback(() => muteAllTabsInWindow(tabIds), [tabIds])
  const reloadAll = useCallback(() => reloadAllTabsInWindow(tabIds), [tabIds])
  const unmuteAll = useCallback(() => unmuteAllTabsInWindow(tabIds), [tabIds])

  return useMemo(
    () => ({ close, copyAllUrls, focus, muteAll, reloadAll, unmuteAll }),
    [close, copyAllUrls, focus, muteAll, reloadAll, unmuteAll],
  )
}
