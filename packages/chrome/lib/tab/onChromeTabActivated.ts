import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a tab becomes active in a window.
 */
export const onChromeTabActivated = (
  activeInfo: chrome.tabs.TabActiveInfo,
): void => {
  const { tabId, windowId } = activeInfo
  const state = useBrowserStore.getState()

  const windowBrowserTabs = Object.values(state.tabById).filter(
    (tab) => tab.windowId === windowId,
  )
  const activeBrowserTab = windowBrowserTabs.find((tab) => tab.active)
  if (activeBrowserTab && activeBrowserTab.id !== tabId) {
    state.updateTabById(activeBrowserTab.id, { active: false })
  }

  const activatedBrowserTab = state.tabById[tabId]
  if (activatedBrowserTab && !activatedBrowserTab.active) {
    state.updateTabById(activatedBrowserTab.id, { active: true })
  }
}
