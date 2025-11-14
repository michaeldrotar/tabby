import { useBrowserWindowsStore } from './useBrowserWindowsStore.js'

/**
 * Provides a hash of all browser windows by ID.
 *
 * @example
 * const browserWindowsById = useBrowserWindowsById()
 * return desiredIds.map(id => <div>Window {id} {browserWindowsById[id].focused ? '(focused)' : ''}</div>)
 */
export const useBrowserWindowsById = () =>
  useBrowserWindowsStore((state) => state.byId)
