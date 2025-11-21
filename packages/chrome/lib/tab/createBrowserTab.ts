import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserTab } from './BrowserTab.js'

/**
 * Creates a new browser tab.
 */
export const createBrowserTab = async (
  options?: chrome.tabs.CreateProperties,
): Promise<BrowserTab> => {
  const newChromeTab = await chrome.tabs.create(options || {})
  if (!newChromeTab.id) {
    throw new Error('createBrowserTab created a tab without an ID')
  }
  // This is assumed to exist because onCreated is fired before
  // the create promise resolves.
  const state = useBrowserStore.getState()
  const newBrowserTab = state.tabById[newChromeTab.id]
  if (!newBrowserTab) {
    throw new Error(
      'createBrowserTab was unable to find the created browser tab',
    )
  }
  return newBrowserTab
}
