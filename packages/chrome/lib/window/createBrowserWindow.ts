import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindow } from './BrowserWindow.js'

/**
 * Creates a new browser window.
 */
export const createBrowserWindow = async (
  options?: chrome.windows.CreateData,
): Promise<BrowserWindow> => {
  const newChromeWindow = await chrome.windows.create(options || {})
  if (!newChromeWindow) {
    throw new Error('createBrowserWindow failed to create a window')
  }
  if (!newChromeWindow.id) {
    throw new Error('createBrowserWindow created a window without an ID')
  }
  // This is assumed to exist because onCreated is fired before
  // the create promise resolves.
  const state = useBrowserStore.getState()
  const newBrowserWindow = state.windowById[newChromeWindow.id]
  if (!newBrowserWindow) {
    throw new Error(
      'createBrowserWindow was unable to find the created browser window',
    )
  }
  return newBrowserWindow
}
