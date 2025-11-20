import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when a tab becomes active in a window.
 */
export const onChromeTabActivated = (
  activeInfo: chrome.tabs.TabActiveInfo,
): void => {
  const { tabId, windowId } = activeInfo
  const state = useBrowserTabStore.getState()

  const windowBrowserTabs = state.byWindowId[windowId]
  const activeBrowserTab = windowBrowserTabs.find((tab) => tab.active)
  if (activeBrowserTab && activeBrowserTab.id !== tabId) {
    state.updateById(activeBrowserTab.id, { active: false })
  }

  const activatedBrowserTab = state.byId[tabId]
  if (activatedBrowserTab && !activatedBrowserTab.active) {
    state.updateById(activatedBrowserTab.id, { active: true })
  }
}
