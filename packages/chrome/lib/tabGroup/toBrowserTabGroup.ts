import type { BrowserTabGroup } from './BrowserTabGroup.js'

/**
 * Converts a chrome.tabGroups.TabGroup to a BrowserTabGroup.
 *
 * If unable, logs a warning and returns undefined.
 */
export const toBrowserTabGroup = (
  chromeTabGroup: chrome.tabGroups.TabGroup,
): BrowserTabGroup | undefined => {
  if (typeof chromeTabGroup.id !== 'number' || chromeTabGroup.id < 0) {
    console.warn(
      `toBrowserTabGroup got a group with a bad id ${chromeTabGroup.id}, skipping...`,
    )
    return undefined
  }
  return {
    ...chromeTabGroup,
  }
}
