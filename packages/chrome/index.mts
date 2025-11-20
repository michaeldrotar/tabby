export type { BrowserTab } from './lib/tab/BrowserTab.js'
export type { BrowserTabID } from './lib/tab/BrowserTabID.js'

export { useTabs } from './lib/useTabs.js'
export { useBrowserTabById } from './lib/tab/useBrowserTabById.js'
export { useBrowserTabs } from './lib/tab/useBrowserTabs.js'
export { useBrowserTabsById } from './lib/tab/useBrowserTabsById.js'
export { useBrowserTabsByWindowId } from './lib/tab/useBrowserTabsByWindowId.js'

export { createBrowserTab } from './lib/tab/createBrowserTab.js'
export { updateBrowserTabById } from './lib/tab/updateBrowserTabById.js'
export { removeBrowserTabById } from './lib/tab/removeBrowserTabById.js'

export { useTabGroups } from './lib/useTabGroups.js'

export type { BrowserWindow } from './lib/window/BrowserWindow.js'
export type { BrowserWindowID } from './lib/window/BrowserWindowID.js'

export { useBrowserWindowById } from './lib/window/useBrowserWindowById.js'
export { useBrowserWindows } from './lib/window/useBrowserWindows.js'
export { useBrowserWindowsById } from './lib/window/useBrowserWindowsById.js'
export { useCurrentBrowserWindow } from './lib/window/useCurrentBrowserWindow.js'
export { useFocusedBrowserWindow } from './lib/window/useFocusedBrowserWindow.js'

export { createBrowserWindow } from './lib/window/createBrowserWindow.js'
export { updateBrowserWindowById } from './lib/window/updateBrowserWindowById.js'
export { removeBrowserWindowById } from './lib/window/removeBrowserWindowById.js'

export {
  BrowserStoreProvider,
  type BrowserStoreProviderProps,
} from './lib/BrowserStoreProvider.js'
