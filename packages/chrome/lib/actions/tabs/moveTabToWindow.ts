import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Moves a tab to a different window.
 */
export const moveTabToWindow = async (
  tabId: BrowserTabID,
  targetWindowId: BrowserWindowID,
): Promise<void> => {
  await chrome.tabs.move(tabId, { windowId: targetWindowId, index: -1 })
}
