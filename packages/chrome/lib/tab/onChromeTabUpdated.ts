import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a chrome tab is updated.
 */
export const onChromeTabUpdated = (
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab,
): void => {
  console.log({ tabId, changeInfo, tab })

  const browserTab = toBrowserTab(tab)
  if (!browserTab) return

  const state = useBrowserTabStore.getState()
  state.updateById(tabId, changeInfo)
}
