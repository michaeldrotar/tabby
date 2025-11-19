import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Provides a hash of all browser windows by ID.
 *
 * @example
 * const browserWindowsById = useBrowserWindowsById()
 * return desiredIds.map(id => <div>Window {id} {browserWindowsById[id].focused ? '(focused)' : ''}</div>)
 */
export const useBrowserWindowsById = (): Record<
  BrowserWindowID,
  BrowserWindow
> => {
  return useBrowserWindowStore((state) => state.byId)
}
