import type { BrowserTabID } from '../../tab/BrowserTabID.js'
import type { BrowserWindowID } from '../../window/BrowserWindowID.js'

/**
 * Moves a tab to a new window.
 */
export const moveTabToNewWindow = async (
  tabId: BrowserTabID,
): Promise<BrowserWindowID> => {
  const window = await chrome.windows.create({ tabId })
  if (!window || window.id === undefined) {
    throw new Error('Chrome did not return the new window ID.')
  }
  return window.id as BrowserWindowID
}
