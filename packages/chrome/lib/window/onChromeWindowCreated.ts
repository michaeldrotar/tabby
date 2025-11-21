import { toBrowserWindow } from './toBrowserWindow.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a new chrome window is opened.
 */
export const onChromeWindowCreated = (
  newChromeWindow: chrome.windows.Window,
): void => {
  const newBrowserWindow = toBrowserWindow(newChromeWindow)
  if (!newBrowserWindow) return
  const state = useBrowserStore.getState()
  state.addWindow(newBrowserWindow)
}
