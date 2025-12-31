import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Moves a tab to a new window.
 */
export const moveTabToNewWindow = async (
  tabId: BrowserTabID,
): Promise<void> => {
  await chrome.windows.create({ tabId })
}
