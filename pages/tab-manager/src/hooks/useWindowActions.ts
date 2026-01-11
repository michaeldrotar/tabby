import { closeWindow } from '@extension/chrome/actions/windows/closeWindow'
import { copyAllUrlsInWindow } from '@extension/chrome/actions/windows/copyAllUrlsInWindow'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { muteAllTabsInWindow } from '@extension/chrome/actions/windows/muteAllTabsInWindow'
import { reloadAllTabsInWindow } from '@extension/chrome/actions/windows/reloadAllTabsInWindow'
import { unmuteAllTabsInWindow } from '@extension/chrome/actions/windows/unmuteAllTabsInWindow'
import { tt } from '@extension/i18n/plurals'
import { toast } from '@extension/ui/components/Toaster'
import { useCallback, useMemo } from 'react'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'

/**
 * Actions for managing browser windows via context menu.
 * Includes toast feedback for copy operations and bulk actions.
 */
export const useWindowActions = (window: BrowserWindow, tabs: BrowserTab[]) => {
  const windowId = window.id
  const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs])

  const close = useCallback(() => closeWindow(windowId), [windowId])
  const copyAllUrls = useCallback(async () => {
    await copyAllUrlsInWindow(tabs)
    toast.success(tt('toast_nUrlsCopied', tabs.length))
  }, [tabs])
  const focus = useCallback(() => focusWindow(windowId), [windowId])
  const muteAll = useCallback(() => muteAllTabsInWindow(tabIds), [tabIds])
  const reloadAll = useCallback(() => reloadAllTabsInWindow(tabIds), [tabIds])
  const unmuteAll = useCallback(() => unmuteAllTabsInWindow(tabIds), [tabIds])

  return useMemo(
    () => ({ close, copyAllUrls, focus, muteAll, reloadAll, unmuteAll }),
    [close, copyAllUrls, focus, muteAll, reloadAll, unmuteAll],
  )
}
