import type { BrowserTabID } from './BrowserTabID.js'

/**
 * Removes an existing browser tab according to its ID.
 */
export const removeBrowserTabById = async (id: BrowserTabID): Promise<void> => {
  await chrome.tabs.remove(id)
}
