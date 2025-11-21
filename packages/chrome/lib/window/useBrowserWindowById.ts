import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Provides a browser window by its ID.
 *
 * @example
 * const browserWindow = useBrowserWindow(props.id)
 * return <div>Window {browserWindow.id} {browserWindow.focused ? '(focused)' : ''}</div>)
 */
export const useBrowserWindowById = (
  id: BrowserWindowID,
): BrowserWindow | undefined => {
  return useBrowserStore((state) => (id ? state.windowById[id] : undefined))
}
