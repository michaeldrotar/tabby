import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Updates an existing browser window with the supplied info.
 * Resolves with the updated browser window.
 */
export const updateBrowserWindowById = async (
  id: BrowserWindowID,
  info: chrome.windows.UpdateInfo,
): Promise<BrowserWindow> => {
  await chrome.windows.update(id, info)
  // Events will handle applying the updates to the object and it is
  // assumed that the state is updated before the promise resolves
  // back to here.
  const state = useBrowserWindowStore.getState()
  const updatedBrowserWindow = state.byId[id]
  if (!updatedBrowserWindow) {
    throw new Error(
      'updateBrowserWindowById failed to get the updated browser window',
    )
  }
  return updatedBrowserWindow
}
