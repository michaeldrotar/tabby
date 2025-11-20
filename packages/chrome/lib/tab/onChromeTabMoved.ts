import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a chrome tab is moved within a window.
 */
export const onChromeTabMoved = (
  tabId: number,
  moveInfo: chrome.tabs.TabMoveInfo,
): void => {
  const state = useBrowserTabStore.getState()
  state.moveById(tabId, { toIndex: moveInfo.toIndex })
}
