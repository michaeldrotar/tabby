import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindow } from './BrowserWindow.js'

/**
 * Provides the current browser window where the current script
 * is loaded.
 *
 * May be initially undefined but should always have a browser
 * window once the lib is loaded.
 */
export const useCurrentBrowserWindow = (): BrowserWindow | undefined => {
  return useBrowserWindowStore((state) =>
    state.currentId ? state.byId[state.currentId] : undefined,
  )
}
