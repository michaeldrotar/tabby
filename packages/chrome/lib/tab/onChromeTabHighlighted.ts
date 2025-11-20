import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Handles when the highlighted tab selection changes within a window.
 */
export const onChromeTabHighlighted = (
  highlightInfo: chrome.tabs.TabHighlightInfo,
): void => {
  const state = useBrowserTabStore.getState()
  const { tabIds, windowId } = highlightInfo
  const windowTabs = state.byWindowId[windowId]
  if (!windowTabs || windowTabs.length === 0) return

  const highlightedTabIds = new Set(tabIds)
  windowTabs.forEach((tab) => {
    const shouldBeHighlighted = highlightedTabIds.has(tab.id)
    if (tab.highlighted !== shouldBeHighlighted) {
      state.updateById(tab.id, { highlighted: shouldBeHighlighted })
    }
  })
}
