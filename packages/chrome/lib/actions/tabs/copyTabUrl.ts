import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Copies a tab's URL to the clipboard.
 */
export const copyTabUrl = async (tabId: BrowserTabID): Promise<void> => {
  const tab = await chrome.tabs.get(tabId)
  if (tab.url) {
    await navigator.clipboard.writeText(tab.url)
  }
}
