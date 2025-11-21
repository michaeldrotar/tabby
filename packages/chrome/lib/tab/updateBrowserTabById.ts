import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'

/**
 * Updates an existing browser tab with the supplied info.
 * Resolves with the updated browser tab.
 */
export const updateBrowserTabById = async (
  id: BrowserTabID,
  info: chrome.tabs.UpdateProperties,
): Promise<BrowserTab> => {
  await chrome.tabs.update(id, info)
  // Events will handle applying the updates to the object and it is
  // assumed that the state is updated before the promise resolves
  // back to here.
  const state = useBrowserStore.getState()
  const updatedBrowserTab = state.tabById[id]
  if (!updatedBrowserTab) {
    throw new Error(
      'updateBrowserTabById failed to get the updated browser tab',
    )
  }
  return updatedBrowserTab
}
