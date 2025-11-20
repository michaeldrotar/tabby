import { registerChromeWindowEventHandlers } from './registerChromeWindowEventHandlers.js'
import { toBrowserWindow } from './toBrowserWindow.js'
import { unloadBrowserWindowStore } from './unloadBrowserWindowStore.js'
import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Gets all browser windows.
 */
const getAllBrowserWindows = async (): Promise<BrowserWindow[]> => {
  const allChromeWindows = await chrome.windows.getAll()
  const allBrowserWindows = allChromeWindows.map(toBrowserWindow)
  return allBrowserWindows.filter((window) => window !== undefined)
}

/**
 * Gets the current browser window.
 *
 * The current browser window is the one that owns the side panel
 * executing this script.
 */
const getCurrentBrowserWindow = async (): Promise<
  BrowserWindow | undefined
> => {
  const chromeWindow = await chrome.windows.getCurrent()
  const browserWindow = toBrowserWindow(chromeWindow)
  return browserWindow
}

/**
 * Loads the lib and registers all its event handlers.
 * Once the promise resolves, everything is ready to be used.
 *
 * If this fails, it will call `unloadBrowserWindowStore` to return to its
 * initial state.
 */
export const loadBrowserWindowStore = async (): Promise<void> => {
  const getState = useBrowserWindowStore.getState
  if (getState().state !== 'initial') return

  const setState = useBrowserWindowStore.setState
  setState({
    state: 'loading',
  })

  try {
    const [allBrowserWindows, currentBrowserWindow] = await Promise.all([
      getAllBrowserWindows(),
      getCurrentBrowserWindow(),
    ])
    if (getState().state !== 'loading') return

    const browserWindowById: Record<BrowserWindowID, BrowserWindow> = {}
    let focusedBrowserWindow: BrowserWindow | undefined = undefined
    for (const browserWindow of allBrowserWindows) {
      browserWindowById[browserWindow.id] = browserWindow
      if (browserWindow.focused) {
        focusedBrowserWindow = browserWindow
      }
    }
    setState({
      all: allBrowserWindows,
      byId: browserWindowById,
      currentId: currentBrowserWindow?.id,
      focusedId: focusedBrowserWindow?.id,
    })
    registerChromeWindowEventHandlers()
    setState({
      state: 'loaded',
    })
  } catch (error) {
    console.error(error)
    unloadBrowserWindowStore()
  }
}
