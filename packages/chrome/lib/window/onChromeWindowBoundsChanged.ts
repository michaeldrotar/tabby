import { toBrowserWindow } from './toBrowserWindow.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when the bounds or state of a chrome window are changed.
 *
 * If the user is dragging a window to resize it, this may not
 * fire until they release the window.
 */
export const onChromeWindowBoundsChanged = (
  updatedChromeWindow: chrome.windows.Window,
): void => {
  const updatedBrowserWindow = toBrowserWindow(updatedChromeWindow)
  if (!updatedBrowserWindow) return

  const state = useBrowserStore.getState()
  state.updateWindowById(updatedBrowserWindow.id, updatedBrowserWindow)
}
