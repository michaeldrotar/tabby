import { useBrowserWindowsStore } from './useBrowserWindowsStore.js'

/**
 * Provides the current browser window where the current script
 * is loaded.
 *
 * May be initially undefined but should always have a browser
 * window once the lib is loaded.
 */
export const useCurrentBrowserWindow = () =>
  useBrowserWindowsStore((state) => state.current)
