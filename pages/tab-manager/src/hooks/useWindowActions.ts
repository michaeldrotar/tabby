import { useCallback } from 'react'
import type { BrowserWindow, BrowserTab } from '@extension/chrome'

/**
 * Actions for managing browser windows via context menu.
 * All actions are async and handle errors gracefully.
 */
export const useWindowActions = (window: BrowserWindow, tabs: BrowserTab[]) => {
  const windowId = window.id

  const focus = useCallback(async () => {
    await chrome.windows.update(windowId, { focused: true })
  }, [windowId])

  const muteAll = useCallback(async () => {
    const tabIds = tabs.map((t) => t.id)
    await Promise.all(
      tabIds.map((id) => chrome.tabs.update(id, { muted: true })),
    )
  }, [tabs])

  const unmuteAll = useCallback(async () => {
    const tabIds = tabs.map((t) => t.id)
    await Promise.all(
      tabIds.map((id) => chrome.tabs.update(id, { muted: false })),
    )
  }, [tabs])

  const reloadAll = useCallback(async () => {
    const tabIds = tabs.map((t) => t.id)
    await Promise.all(tabIds.map((id) => chrome.tabs.reload(id)))
  }, [tabs])

  const copyAllUrls = useCallback(async () => {
    const urls = tabs
      .map((tab) => tab.url)
      .filter((url): url is string => !!url)
    await navigator.clipboard.writeText(urls.join('\n'))
  }, [tabs])

  const close = useCallback(async () => {
    await chrome.windows.remove(windowId)
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
