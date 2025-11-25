import { toBrowserTab } from './toBrowserTab.js'
import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'

export const refreshBrowserTab = async (
  id: BrowserTabID,
): Promise<BrowserTab | undefined> => {
  const chromeTab = await chrome.tabs.get(id)
  const browserTab = toBrowserTab(chromeTab)
  if (!browserTab) return

  const state = useBrowserStore.getState()
  return state.replaceTab(browserTab)
}
