// Action exports - Tab Groups
export { changeTabGroupColor } from './lib/actions/tabGroups/changeTabGroupColor.js'
export { copyTabGroupUrls } from './lib/actions/tabGroups/copyTabGroupUrls.js'
export { moveTabGroupBackward } from './lib/actions/tabGroups/moveTabGroupBackward.js'
export { moveTabGroupForward } from './lib/actions/tabGroups/moveTabGroupForward.js'
export { moveTabGroupToNewWindow } from './lib/actions/tabGroups/moveTabGroupToNewWindow.js'
export { renameTabGroup } from './lib/actions/tabGroups/renameTabGroup.js'
export { toggleTabGroupCollapsed } from './lib/actions/tabGroups/toggleTabGroupCollapsed.js'

// Action exports - Tabs
export { activateTab } from './lib/actions/tabs/activateTab.js'
export { addTabToGroup } from './lib/actions/tabs/addTabToGroup.js'
export { addTabToNewGroup } from './lib/actions/tabs/addTabToNewGroup.js'
export { closeOtherTabs } from './lib/actions/tabs/closeOtherTabs.js'
export { closeTab } from './lib/actions/tabs/closeTab.js'
export { closeTabs } from './lib/actions/tabs/closeTabs.js'
export { closeTabsAfter } from './lib/actions/tabs/closeTabsAfter.js'
export { copyTabTitle } from './lib/actions/tabs/copyTabTitle.js'
export { copyTabTitleAndUrl } from './lib/actions/tabs/copyTabTitleAndUrl.js'
export { copyTabUrl } from './lib/actions/tabs/copyTabUrl.js'
export { duplicateTab } from './lib/actions/tabs/duplicateTab.js'
export { moveTabBackward } from './lib/actions/tabs/moveTabBackward.js'
export { moveTabForward } from './lib/actions/tabs/moveTabForward.js'
export { moveTabToNewWindow } from './lib/actions/tabs/moveTabToNewWindow.js'
export { moveTabToWindow } from './lib/actions/tabs/moveTabToWindow.js'
export { muteTab } from './lib/actions/tabs/muteTab.js'
export { pinTab } from './lib/actions/tabs/pinTab.js'
export { reloadTab } from './lib/actions/tabs/reloadTab.js'
export { removeTabFromGroup } from './lib/actions/tabs/removeTabFromGroup.js'
export { ungroupTabs } from './lib/actions/tabs/ungroupTabs.js'
export { unmuteTab } from './lib/actions/tabs/unmuteTab.js'
export { unpinTab } from './lib/actions/tabs/unpinTab.js'

// Action exports - Windows
export { closeWindow } from './lib/actions/windows/closeWindow.js'
export { copyAllUrlsInWindow } from './lib/actions/windows/copyAllUrlsInWindow.js'
export { focusWindow } from './lib/actions/windows/focusWindow.js'
export { muteAllTabsInWindow } from './lib/actions/windows/muteAllTabsInWindow.js'
export { reloadAllTabsInWindow } from './lib/actions/windows/reloadAllTabsInWindow.js'
export { unmuteAllTabsInWindow } from './lib/actions/windows/unmuteAllTabsInWindow.js'

// Provider and store exports
export { BrowserStoreProvider } from './lib/BrowserStoreProvider.js'
export { useBrowserStore } from './lib/useBrowserStore.js'
export { useBrowserStoreState } from './lib/useBrowserStoreState.js'

// Tab exports
export type { BrowserTab } from './lib/tab/BrowserTab.js'
export type { BrowserTabID } from './lib/tab/BrowserTabID.js'
export { useBrowserTabs } from './lib/tab/useBrowserTabs.js'
export { useBrowserTabsByWindowId } from './lib/tab/useBrowserTabsByWindowId.js'

// Tab group exports
export type {
  BrowserTabGroup,
  BrowserTabGroupColor,
} from './lib/tabGroup/BrowserTabGroup.js'
export type { BrowserTabGroupID } from './lib/tabGroup/BrowserTabGroupID.js'
export { useBrowserTabGroupsByWindowId } from './lib/tabGroup/useBrowserTabGroupsByWindowId.js'

// Window exports
export type { BrowserWindow } from './lib/window/BrowserWindow.js'
export type { BrowserWindowID } from './lib/window/BrowserWindowID.js'
export { createBrowserWindow } from './lib/window/createBrowserWindow.js'
export { useBrowserWindows } from './lib/window/useBrowserWindows.js'
export { useCurrentBrowserWindow } from './lib/window/useCurrentBrowserWindow.js'
export { useSelectedWindowId } from './lib/window/useSelectedWindowId.js'
export { useSetSelectedWindowId } from './lib/window/useSetSelectedWindowId.js'

// Utility exports
export { usePlatformInfo } from './lib/usePlatformInfo.js'
export { useTabListItems } from './lib/useTabListItems.js'
