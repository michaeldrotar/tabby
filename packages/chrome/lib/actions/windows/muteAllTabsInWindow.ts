import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Mutes all tabs in a window.
 */
export const muteAllTabsInWindow = async (
  tabIds: readonly BrowserTabID[],
): Promise<void> => {
  await Promise.all(tabIds.map((id) => chrome.tabs.update(id, { muted: true })))
}
