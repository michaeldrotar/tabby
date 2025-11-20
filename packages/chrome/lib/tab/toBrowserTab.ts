import type { BrowserTab } from './BrowserTab.js'

/**
 * Converts a chrome.tabs.Tab to a BrowserTab.
 *
 * If unable, logs a warning and returns undefined. In practice, that is
 * never expected to happen because all visible tabs that this lib
 * works with should all have IDs. Only the session API should
 * return chrome.tabs.Tab objects without IDs.
 */
export const toBrowserTab = (
  chromeTab: chrome.tabs.Tab,
): BrowserTab | undefined => {
  if (typeof chromeTab.id !== 'number' || chromeTab.id < 0) {
    console.warn(
      `toBrowserTab got a window with a bad id ${chromeTab.id}, skipping...`,
    )
    return undefined
  }
  return {
    id: chromeTab.id,
    ...chromeTab,
  }
}
