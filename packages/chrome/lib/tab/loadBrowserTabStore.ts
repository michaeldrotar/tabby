import { registerChromeTabEventHandlers } from './registerChromeTabEventHandlers.js'
import { toBrowserTab } from './toBrowserTab.js'
import { unloadBrowserTabStore } from './unloadBrowserTabStore.js'
import { useBrowserTabStore } from './useBrowserTabStore.js'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'
import type { BrowserWindowID } from '../window/BrowserWindowID.js'

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
 * If this fails, it will call `unloadBrowserTabStore` to return to its
 * initial state.
 */
export const loadBrowserTabStore = async (): Promise<void> => {
  const getState = useBrowserTabStore.getState
  if (getState().state !== 'initial') return

  const setState = useBrowserTabStore.setState
  setState({
    state: 'loading',
  })

  try {
    const [allBrowserTabs] = await Promise.all([getAllBrowserTabs()])
    if (getState().state !== 'loading') return

    const browserTabById: Record<BrowserTabID, BrowserTab> = {}
    const browserTabsByWindowId: Record<BrowserWindowID, BrowserTab[]> = {}
    for (const browserTab of allBrowserTabs) {
      browserTabById[browserTab.id] = browserTab
      if (!browserTabsByWindowId[browserTab.windowId]) {
        browserTabsByWindowId[browserTab.windowId] = []
      }
      browserTabsByWindowId[browserTab.windowId].push(browserTab)
    }
    setState({
      all: allBrowserTabs,
      byId: browserTabById,
      byWindowId: browserTabsByWindowId,
    })
    registerChromeTabEventHandlers()
    setState({
      state: 'loaded',
    })
  } catch (error) {
    console.error(error)
    unloadBrowserTabStore()
  }
}
