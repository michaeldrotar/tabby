import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a chrome tab is removed.
 */
export const onChromeTabRemoved = (
  removedTabId: number,
  removeInfo: chrome.tabs.TabRemoveInfo,
): void => {
  const state = useBrowserStore.getState()
  state.removeTabById(removedTabId, removeInfo)
}
