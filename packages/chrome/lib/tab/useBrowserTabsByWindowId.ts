import { useBrowserStore } from '../useBrowserStore.js'
import { useShallow } from 'zustand/shallow'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserWindowID } from '../window/BrowserWindowID.js'

/**
 * Provides all browser tabs belonging to the window ID.
 *
 * @example
 * const browserTabs = useBrowserTabsByWindowId(props.windowId)
 * return browserTabs.map(browserTab => <div key={browserTab.id}>Tab {browserTab.id}</div>)
 */
export const useBrowserTabsByWindowId = (
  windowId: BrowserWindowID | undefined,
): BrowserTab[] => {
  const tabs = useBrowserStore(
    useShallow((state) => {
      if (!windowId) return []
      return Object.values(state.tabById)
        .filter((t) => t.windowId === windowId)
        .sort((a, b) => a.index - b.index)
    }),
  )
  return tabs
}
