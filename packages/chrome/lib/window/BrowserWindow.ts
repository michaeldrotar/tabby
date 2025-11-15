import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Represents a visible browser window.
 *
 * This wraps chrome.windows.Window to provide a type that guarantees an ID.
 * It seems to be optional in the chrome API because the session API gives
 * window data for recently closed windows, which no longer have an ID.
 */
export type BrowserWindow = Omit<chrome.windows.Window, 'id' | 'tabs'> & {
  /**
   * The ID of the browser window.
   *
   * Every browser window will have one or else a warning will be logged
   * and the window will be ignored.
   */
  id: BrowserWindowID
}
