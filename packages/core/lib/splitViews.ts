import type { BrowserSnapshot } from './browser.js'

export const getSplitViewBlockReason = (
  snapshot: BrowserSnapshot,
  tabIds: readonly number[],
): string | undefined => {
  if (!snapshot.splitViewSupported)
    return 'Split view controls are unavailable in this browser.'
  if (tabIds.length !== 2 || new Set(tabIds).size !== 2)
    return 'Select two tabs to open in split view.'
  const tabs = tabIds.map((id) => snapshot.tabs.find((tab) => tab.id === id))
  const first = tabs[0],
    second = tabs[1]
  if (!first || !second) return 'The selected tabs are no longer available.'
  if (tabs.some((tab) => tab?.splitViewId !== undefined))
    return 'Separate existing split views before pairing these tabs.'
  if (first.windowId !== second.windowId)
    return 'Split view tabs must be in the same window.'
  if (Boolean(first.pinned) !== Boolean(second.pinned))
    return 'Split view tabs must have the same pinned state.'
  if (first.groupId !== second.groupId)
    return 'Split view tabs must be in the same group or both outside groups.'
  return undefined
}
