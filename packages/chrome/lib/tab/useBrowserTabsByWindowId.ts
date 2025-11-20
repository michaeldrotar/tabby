import { useBrowserTabStore } from './useBrowserTabStore.js'
import { useState } from 'react'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserWindowID } from 'index.mjs'

/**
 * Provides all browser tabs belonging to the window ID.
 *
 * @example
 * const browserTabs = useBrowserTabsByWindowId(props.windowId)
 * return browserTabs.map(browserTab => <div key={browserTab.id}>Tab {browserTab.id}</div>)
 */
export const useBrowserTabsByWindowId = (
  windowId: BrowserWindowID,
): BrowserTab[] => {
  console.log('useBrowserTabsByWindowId', windowId)
  const tabs = useBrowserTabStore((state) => state.byWindowId[windowId])
  const [noTabs] = useState(() => [])
  return tabs ?? noTabs
}
