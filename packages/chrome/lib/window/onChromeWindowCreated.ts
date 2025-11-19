import { toBrowserWindow } from './toBrowserWindow.js'
import { useBrowserWindowStore } from './useBrowserWindowStore.js'

/**
 * Handles when a new chrome window is opened.
 */
export const onChromeWindowCreated = (
  newChromeWindow: chrome.windows.Window,
): void => {
  const newBrowserWindow = toBrowserWindow(newChromeWindow)
  if (!newBrowserWindow) return
  const state = useBrowserWindowStore.getState()
  state.add(newBrowserWindow)
}
