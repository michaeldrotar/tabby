import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Reloads all tabs in a window.
 */
export const reloadAllTabsInWindow = async (
  tabIds: readonly BrowserTabID[],
): Promise<void> => {
  await Promise.all(tabIds.map((id) => chrome.tabs.reload(id)))
}
