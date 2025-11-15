import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Represents a browser tab.
 *
 * This wraps chrome.tabs.Tab to provide a type that guarantees an ID.
 * It seems to be optional in the chrome API because the session API gives
 * tab data for recently closed tabs, which no longer have an ID.
 *
 * Also chrome tabs can have an ID of TAB_ID_NONE for app and devtool
 * tabs but those would also be excluded from this type.
 */
export type BrowserTab = Omit<chrome.tabs.Tab, 'id'> & {
  /**
   * The ID of the browser window.
   *
   * Every browser window will have one or else a warning will be logged
   * and the window will be ignored.
   */
  id: BrowserWindowID
}
