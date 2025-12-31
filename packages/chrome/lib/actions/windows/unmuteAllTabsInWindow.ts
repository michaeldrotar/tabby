import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Unmutes all tabs in a window.
 */
export const unmuteAllTabsInWindow = async (
  tabIds: readonly BrowserTabID[],
): Promise<void> => {
  await Promise.all(
    tabIds.map((id) => chrome.tabs.update(id, { muted: false })),
  )
}
