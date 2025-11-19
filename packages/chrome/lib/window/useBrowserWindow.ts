import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Provides a browser window by its ID.
 *
 * @example
 * const browserWindow = useBrowserWindow(props.id)
 * return <div>Window {browserWindow.id} {browserWindow.focused ? '(focused)' : ''}</div>)
 */
export const useBrowserWindowsById = (
  id: BrowserWindowID,
): BrowserWindow | undefined => {
  return useBrowserWindowStore((state) => (id ? state.byId[id] : undefined))
}
