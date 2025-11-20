import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a chrome tab is attached to a window.
 */
export const onChromeTabAttached = (
  tabId: number,
  attachInfo: chrome.tabs.TabAttachInfo,
): void => {
  const state = useBrowserTabStore.getState()
  state.updateById(tabId, {
    windowId: attachInfo.newWindowId,
    index: attachInfo.newPosition,
  })
}
