import type { BrowserWindow } from './BrowserWindow.js'

/**
 * Converts a chrome.windows.Window to a BrowserWindow.
 *
 * If unable, logs a warning and returns undefined. In practice, that is
 * never expected to happen because all visible windows that this lib
 * works with should all have IDs. Only the session API should
 * return chrome.windows.Window objects without IDs.
 */
export const toBrowserWindow = (
  chromeWindow: chrome.windows.Window,
): BrowserWindow | undefined => {
  if (typeof chromeWindow.id !== 'number' || chromeWindow.id < 0) {
    console.warn(
      `toBrowserWindow got a window with a bad id ${chromeWindow.id}, skipping...`,
    )
    return undefined
  }
  return {
    id: chromeWindow.id,
    ...chromeWindow,
  }
}
