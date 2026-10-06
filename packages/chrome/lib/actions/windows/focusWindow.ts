import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Focuses a window by ID.
 */
export const focusWindow = async (windowId: BrowserWindowID): Promise<void> => {
  await chrome.windows.update(windowId, { focused: true })
}
