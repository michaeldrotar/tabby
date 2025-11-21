import { registerChromeTabEventHandlers } from './tab/registerChromeTabEventHandlers.js'
import { toBrowserTab } from './tab/toBrowserTab.js'
import { unloadBrowserStore } from './unloadBrowserStore.js'
import { useBrowserStore } from './useBrowserStore.js'
import { registerChromeWindowEventHandlers } from './window/registerChromeWindowEventHandlers.js'
import { toBrowserWindow } from './window/toBrowserWindow.js'
import type { BrowserTab } from './tab/BrowserTab.js'
import type { BrowserTabID } from './tab/BrowserTabID.js'
import type { BrowserWindow } from './window/BrowserWindow.js'
import type { BrowserWindowID } from './window/BrowserWindowID.js'

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
 * Gets all browser tabs.
 */
const getAllBrowserTabs = async (): Promise<BrowserTab[]> => {
  const allChromeTabs = await chrome.tabs.query({})
  const allBrowserTabs = allChromeTabs.map(toBrowserTab)
  return allBrowserTabs.filter((tab) => tab !== undefined)
}

/**
 * Loads the lib and registers all its event handlers.
 * Once the promise resolves, everything is ready to be used.
 *
 * If this fails, it will call `unloadBrowserStore` to return to its
 * initial state.
 */
export const loadBrowserStore = async (): Promise<void> => {
  const getState = useBrowserStore.getState
  if (getState().state !== 'initial') return

  const setState = useBrowserStore.setState
  setState({
    state: 'loading',
  })

  try {
    const [allBrowserWindows, currentBrowserWindow, allBrowserTabs] =
      await Promise.all([
        getAllBrowserWindows(),
        getCurrentBrowserWindow(),
        getAllBrowserTabs(),
      ])
    if (getState().state !== 'loading') return

    const browserWindowById: Record<BrowserWindowID, BrowserWindow> = {}
    const browserWindowIds: BrowserWindowID[] = []
    let focusedBrowserWindow: BrowserWindow | undefined = undefined
    for (const browserWindow of allBrowserWindows) {
      browserWindowById[browserWindow.id] = browserWindow
      browserWindowIds.push(browserWindow.id)
      if (browserWindow.focused) {
        focusedBrowserWindow = browserWindow
      }
    }

    const browserTabById: Record<BrowserTabID, BrowserTab> = {}
    for (const browserTab of allBrowserTabs) {
      browserTabById[browserTab.id] = browserTab
    }

    setState({
      windowById: browserWindowById,
      windowIds: browserWindowIds,
      currentWindowId: currentBrowserWindow?.id,
      focusedWindowId: focusedBrowserWindow?.id,
      tabById: browserTabById,
    })

    registerChromeWindowEventHandlers()
    registerChromeTabEventHandlers()

    setState({
      state: 'loaded',
    })
  } catch (error) {
    console.error(error)
    unloadBrowserStore()
  }
}
