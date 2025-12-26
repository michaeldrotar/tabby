import type { BrowserTabGroupID } from './BrowserTabGroupID.js'

/**
 * Represents a browser tab group.
 *
 * This wraps chrome.tabGroups.TabGroup to provide a type that guarantees an ID.
 */
export type BrowserTabGroup = Omit<chrome.tabGroups.TabGroup, 'id'> & {
  /**
   * The ID of the browser tab group.
   */
  id: BrowserTabGroupID
}

export type BrowserTabGroupColor = chrome.tabGroups.TabGroup['color']
