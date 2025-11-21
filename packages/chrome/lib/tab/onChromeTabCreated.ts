import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a new chrome tab is created.
 */
export const onChromeTabCreated = (newChromeTab: chrome.tabs.Tab): void => {
  const newBrowserTab = toBrowserTab(newChromeTab)
  if (!newBrowserTab) return
  const state = useBrowserStore.getState()
  state.addTab(newBrowserTab)
}
