import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a new chrome tab is created.
 */
export const onChromeTabCreated = (newChromeTab: chrome.tabs.Tab): void => {
  const newBrowserTab = toBrowserTab(newChromeTab)
  if (!newBrowserTab) return
  const state = useBrowserTabStore.getState()
  state.add(newBrowserTab)
}
