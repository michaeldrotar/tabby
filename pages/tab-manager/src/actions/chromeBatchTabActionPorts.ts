import { changeTabGroupColor } from '@extension/chrome/actions/tabGroups/changeTabGroupColor'
import { renameTabGroup } from '@extension/chrome/actions/tabGroups/renameTabGroup'
import { toggleTabGroupCollapsed } from '@extension/chrome/actions/tabGroups/toggleTabGroupCollapsed'
import { addTabToGroup } from '@extension/chrome/actions/tabs/addTabToGroup'
import { addTabToNewGroup } from '@extension/chrome/actions/tabs/addTabToNewGroup'
import { closeTabs } from '@extension/chrome/actions/tabs/closeTabs'
import { duplicateTab } from '@extension/chrome/actions/tabs/duplicateTab'
import { moveTabToNewWindow } from '@extension/chrome/actions/tabs/moveTabToNewWindow'
import { moveTabToWindow } from '@extension/chrome/actions/tabs/moveTabToWindow'
import { muteTab } from '@extension/chrome/actions/tabs/muteTab'
import { pinTab } from '@extension/chrome/actions/tabs/pinTab'
import { reloadTab } from '@extension/chrome/actions/tabs/reloadTab'
import { removeTabFromGroup } from '@extension/chrome/actions/tabs/removeTabFromGroup'
import { unmuteTab } from '@extension/chrome/actions/tabs/unmuteTab'
import { unpinTab } from '@extension/chrome/actions/tabs/unpinTab'
import { closeWindow } from '@extension/chrome/actions/windows/closeWindow'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import type {
  BatchGroupAction,
  BatchTabActionName,
  BatchTabActionPorts,
} from './batchTabActions'
import type { BrowserTabID } from '@extension/chrome/tab/BrowserTabID'
import type { BrowserTabGroupColor } from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { BrowserTabGroupID } from '@extension/chrome/tabGroup/BrowserTabGroupID'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'

/** The only adapter in the batch-action path that calls the Chrome helpers. */
export const chromeBatchTabActionPorts: BatchTabActionPorts = {
  closeTab: (tabId) => closeTabs([tabId as BrowserTabID]),
  moveTab: (tabId, targetWindowId) =>
    moveTabToWindow(tabId as BrowserTabID, targetWindowId as BrowserWindowID),
  moveFirstTabToNewWindow: (tabId) => moveTabToNewWindow(tabId as BrowserTabID),
  addTabToGroup: (tabId, groupId) =>
    addTabToGroup(tabId as BrowserTabID, groupId as BrowserTabGroupID),
  createGroupWithTab: (tabId, targetWindowId) =>
    addTabToNewGroup(tabId as BrowserTabID, targetWindowId as BrowserWindowID),
  performTabAction: (action, tabId) => performTabAction(action, tabId),
  performWindowAction: (action, windowId) =>
    action === 'focus'
      ? focusWindow(windowId as BrowserWindowID)
      : closeWindow(windowId as BrowserWindowID),
  performGroupAction: (action, groupId) =>
    performGroupAction(action, groupId as BrowserTabGroupID),
  writeClipboardText: (text) => navigator.clipboard.writeText(text),
}

const performTabAction = (
  action: BatchTabActionName,
  tabId: number,
): Promise<void> => {
  const id = tabId as BrowserTabID
  switch (action) {
    case 'pin':
      return pinTab(id)
    case 'unpin':
      return unpinTab(id)
    case 'mute':
      return muteTab(id)
    case 'unmute':
      return unmuteTab(id)
    case 'reload':
      return reloadTab(id)
    case 'duplicate':
      return duplicateTab(id)
    case 'ungroup':
      return removeTabFromGroup(id)
  }
}

const performGroupAction = (
  action: BatchGroupAction,
  groupId: BrowserTabGroupID,
): Promise<void> => {
  switch (action.type) {
    case 'change-color':
      return changeTabGroupColor(groupId, action.color as BrowserTabGroupColor)
    case 'rename':
      return renameTabGroup(groupId, action.title)
    case 'set-collapse':
      return toggleTabGroupCollapsed(groupId, !action.collapsed)
  }
}
