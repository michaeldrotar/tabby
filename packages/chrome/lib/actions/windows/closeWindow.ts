import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Closes a window by ID.
 */
export const closeWindow = async (windowId: BrowserWindowID): Promise<void> => {
  await chrome.windows.remove(windowId)
}
