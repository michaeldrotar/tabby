import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a chrome tab is moved within a window.
 */
export const onChromeTabMoved = (
  tabId: number,
  moveInfo: chrome.tabs.TabMoveInfo,
): void => {
  const state = useBrowserStore.getState()
  state.moveTabById(tabId, { toIndex: moveInfo.toIndex })
}
