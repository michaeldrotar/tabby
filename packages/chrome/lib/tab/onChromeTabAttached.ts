import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a chrome tab is attached to a window.
 */
export const onChromeTabAttached = (
  tabId: number,
  attachInfo: chrome.tabs.TabAttachInfo,
): void => {
  const state = useBrowserStore.getState()
  state.updateTabById(tabId, {
    windowId: attachInfo.newWindowId,
    index: attachInfo.newPosition,
  })
}
