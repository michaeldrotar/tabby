import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when the highlighted tab selection changes within a window.
 */
export const onChromeTabHighlighted = (
  highlightInfo: chrome.tabs.TabHighlightInfo,
): void => {
  const state = useBrowserStore.getState()
  const { tabIds, windowId } = highlightInfo
  const windowTabs = Object.values(state.tabById).filter(
    (tab) => tab.windowId === windowId,
  )
  if (!windowTabs || windowTabs.length === 0) return

  const highlightedTabIds = new Set(tabIds)
  windowTabs.forEach((tab) => {
    const shouldBeHighlighted = highlightedTabIds.has(tab.id)
    if (tab.highlighted !== shouldBeHighlighted) {
      state.updateTabById(tab.id, { highlighted: shouldBeHighlighted })
    }
  })
}
