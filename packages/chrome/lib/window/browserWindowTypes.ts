/**
 * The types of chrome windows that are correct for browser windows.
 */
export const browserWindowTypes: chrome.windows.WindowType[] =
  typeof chrome !== 'undefined' ? [chrome.windows.WindowType.NORMAL] : []
