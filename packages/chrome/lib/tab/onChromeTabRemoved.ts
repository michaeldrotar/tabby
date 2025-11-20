import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a chrome tab is removed.
 */
export const onChromeTabRemoved = (
  removedTabId: number,
  removeInfo: chrome.tabs.TabRemoveInfo,
): void => {
  const state = useBrowserTabStore.getState()
  state.removeById(removedTabId, removeInfo)
}
