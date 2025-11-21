import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a chrome tab is updated.
 */
export const onChromeTabUpdated = (
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
): void => {
  const browserTab = toBrowserTab(tab)
  if (!browserTab) return

  const state = useBrowserStore.getState()
  state.updateTabById(tabId, changeInfo)
}
