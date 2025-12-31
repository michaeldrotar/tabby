import type { BrowserTabID } from '../../tab/BrowserTabID.js'

/**
 * Activates (switches to) a tab by ID.
 */
export const activateTab = async (tabId: BrowserTabID): Promise<void> => {
  await chrome.tabs.update(tabId, { active: true })
}
