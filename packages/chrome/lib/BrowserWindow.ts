import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Represents a visible browser window.
 *
 * This wraps chrome.windows.Window to provide a type that guarantees an ID.
 * It seems to be optional in the chrome API because its shared across
 * window and session APIs, and the session API gives window data
 * for recently closed windows, which no longer have an ID.
 */
export type BrowserWindow = chrome.windows.Window & {
  id: BrowserWindowID
}
