import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Copies a tab's title to the clipboard.
 */
export const copyTabTitle = async (tabId: BrowserTabID): Promise<void> => {
  const tab = await chrome.tabs.get(tabId)
  if (tab.title) {
    await navigator.clipboard.writeText(tab.title)
  }
}
