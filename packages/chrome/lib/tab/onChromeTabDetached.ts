import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a chrome tab is detached from its window.
 */
export const onChromeTabDetached = (
  tabId: number,
  detachInfo: chrome.tabs.TabDetachInfo,
): void => {
  const state = useBrowserTabStore.getState()
  state.updateById(tabId, {
    windowId: chrome.windows.WINDOW_ID_NONE,
    index: detachInfo.oldPosition,
  })
}
