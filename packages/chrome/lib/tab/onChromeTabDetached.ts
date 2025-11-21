import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a chrome tab is detached from its window.
 */
export const onChromeTabDetached = (
  tabId: number,
  detachInfo: chrome.tabs.TabDetachInfo,
): void => {
  const state = useBrowserStore.getState()
  state.updateTabById(tabId, {
    windowId: chrome.windows.WINDOW_ID_NONE,
    index: detachInfo.oldPosition,
  })
}
