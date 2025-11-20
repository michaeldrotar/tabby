import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserTabStore } from './useBrowserTabStore.js'
import type { BrowserTab, BrowserTabID } from 'index.mjs'

export const refreshBrowserTab = async (
  id: BrowserTabID,
): Promise<BrowserTab | undefined> => {
  const chromeTab = await chrome.tabs.get(id)
  const browserTab = toBrowserTab(chromeTab)
  if (!browserTab) return

  const state = useBrowserTabStore.getState()
  return state.replace(browserTab)
}
