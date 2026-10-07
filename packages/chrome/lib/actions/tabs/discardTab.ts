import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Discards a tab from memory. Chrome reloads it when it is activated.
 */
export const discardTab = (
  tabId: BrowserTabID,
): Promise<chrome.tabs.Tab | undefined> => chrome.tabs.discard(tabId)
