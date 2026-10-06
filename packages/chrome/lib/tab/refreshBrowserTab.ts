import { useBrowserStore } from '../useBrowserStore.js'
import { toBrowserTab } from './toBrowserTab.js'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'

const deriveLifecycle = (
  existingTab: BrowserTab | undefined,
): BrowserTab['lifecycle'] => {
  if (!existingTab) {
    return 'reloading'
  }

  if (existingTab.lifecycle === 'loaded') {
    return 'reloading'
  }

  return existingTab.lifecycle
}

export const refreshBrowserTab = async (
  id: BrowserTabID,
): Promise<BrowserTab | undefined> => {
  const chromeTab = await chrome.tabs.get(id)
  const state = useBrowserStore.getState()
  const existingTab = state.tabById[id]
  const browserTab = toBrowserTab(chromeTab, {
    lifecycle: deriveLifecycle(existingTab),
  })
  if (!browserTab) return

  return state.replaceTab(browserTab)
}
