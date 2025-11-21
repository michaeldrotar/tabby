import { useBrowserStore } from '../useBrowserStore.js'
import { useShallow } from 'zustand/shallow'
import type { BrowserTab } from './BrowserTab.js'

/**
 * Provides all browser tabs.
 *
 * Use this when you truly need the full list. If you just need a
 * specific tab then its better performance to use
 * `useBrowserTabsByWindowId` or something else more
 * specific.
 *
 * @example
 * const browserTabs = useBrowserTabss();
 * return browserTabs.map(browserTab => <div key={browserTab.id}>Tab {browserTab.id}</div>)
 */
export const useBrowserTabs = (): BrowserTab[] => {
  return useBrowserStore(useShallow((state) => Object.values(state.tabById)))
}
