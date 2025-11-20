import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindow } from './BrowserWindow.js'

/**
 * Provides all browser windows.
 *
 * Use this when you truly need the full list. If you just need a
 * specific window then its better performance to use
 * `useBrowserWindowById` or something else more
 * specific.
 *
 * @example
 * const browserWindows = useBrowserWindows();
 * return browserWindows.map(browserWindow => <div key={browserWindow.id}>Window {browserWindow.id}</div>)
 */
export const useBrowserWindows = (): BrowserWindow[] => {
  return useBrowserWindowStore((state) => state.all)
}
