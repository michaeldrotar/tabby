import { useBrowserTabStore } from './useBrowserTabStore.js'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'

/**
 * Provides a hash of all browser tabs by ID.
 *
 * @example
 * const browserTabsById = useBrowserTabsById()
 * return desiredIds.map(id => <div>Tab {id} {browserTabsById[id].active ? '(active)' : ''}</div>)
 */
export const useBrowserTabsById = (): Record<BrowserTabID, BrowserTab> => {
  return useBrowserTabStore((state) => state.byId)
}
