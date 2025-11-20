import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserTabStore } from './useBrowserTabStore.js'

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

      const state = useBrowserTabStore.getState()
      state.removeById(removedTabId)
      state.add(newBrowserTab)
    })
    .catch((error) => {
      console.error('Failed to handle tab replacement', addedTabId, error)
    })
}
