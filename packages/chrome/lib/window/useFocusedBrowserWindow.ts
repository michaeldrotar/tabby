import { useBrowserWindowsStore } from './useBrowserWindowsStore.js'

/**
 * Provides the focused browser window.
 *
 * This may be undefined if no browser windows are focused or if
 * the focused window is not one that's tracked by the
 * BrowserWindows lib, such as a devtools window.
 */
export const useFocusedBrowserWindow = () => {
  return useBrowserWindowsStore((state) => state.focused)
}
