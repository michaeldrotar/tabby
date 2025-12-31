import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Copies a tab's title and URL to the clipboard.
 */
export const copyTabTitleAndUrl = async (
  tabId: BrowserTabID,
): Promise<void> => {
  const tab = await chrome.tabs.get(tabId)
  const text = `${tab.title ?? ''}\n${tab.url ?? ''}`
  await navigator.clipboard.writeText(text.trim())
}
