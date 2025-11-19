import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Removes an existing browser window according to its ID.
 */
export const removeBrowserWindowById = async (
  id: BrowserWindowID,
): Promise<void> => {
  await chrome.windows.remove(id)
}
