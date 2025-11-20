import { useBrowserTabStore } from './useBrowserTabStore.js'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'

/**
 * Provides a browser tab by its ID.
 *
 * @example
 * const browserTab = useBrowserTab(props.id)
 * return <div>Tab {browserTab.id} {browserTab.active ? '(active)' : ''}</div>)
 */
export const useBrowserTabById = (id: BrowserTabID): BrowserTab | undefined => {
  return useBrowserTabStore((state) => (id ? state.byId[id] : undefined))
}
