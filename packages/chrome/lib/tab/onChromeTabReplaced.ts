import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a chrome tab is replaced by another tab (prerender, etc.).
 */
export const onChromeTabReplaced = (
  addedTabId: number,
  removedTabId: number,
): void => {
  void chrome.tabs
    .get(addedTabId)
    .then((newChromeTab) => {
      const newBrowserTab = toBrowserTab(newChromeTab)
      if (!newBrowserTab) return

      const state = useBrowserStore.getState()
      state.removeTabById(removedTabId)
      state.addTab(newBrowserTab)
    })
    .catch((error) => {
      console.error('Failed to handle tab replacement', addedTabId, error)
    })
}
