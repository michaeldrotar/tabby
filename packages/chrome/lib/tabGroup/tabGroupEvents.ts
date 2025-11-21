import { toBrowserTabGroup } from './toBrowserTabGroup.js'
import { useBrowserStore } from '../useBrowserStore.js'

/**
 * Handles when a new chrome tab group is created.
 */
const onChromeTabGroupCreated = (
  newChromeTabGroup: chrome.tabGroups.TabGroup,
): void => {
  const newBrowserTabGroup = toBrowserTabGroup(newChromeTabGroup)
  if (!newBrowserTabGroup) return
  const state = useBrowserStore.getState()
  state.addTabGroup(newBrowserTabGroup)
}

/**
 * Handles when a chrome tab group is updated.
 */
const onChromeTabGroupUpdated = (tabGroup: chrome.tabGroups.TabGroup): void => {
  const browserTabGroup = toBrowserTabGroup(tabGroup)
  if (!browserTabGroup) return

  const state = useBrowserStore.getState()
  state.updateTabGroupById(tabGroup.id, browserTabGroup)
}

/**
 * Handles when a chrome tab group is removed.
 */
const onChromeTabGroupRemoved = (tabGroup: chrome.tabGroups.TabGroup): void => {
  const state = useBrowserStore.getState()
  state.removeTabGroupById(tabGroup.id)
}

/**
 * Handles when a chrome tab group is moved.
 */
const onChromeTabGroupMoved = (tabGroup: chrome.tabGroups.TabGroup): void => {
  const browserTabGroup = toBrowserTabGroup(tabGroup)
  if (!browserTabGroup) return

  const state = useBrowserStore.getState()
  state.updateTabGroupById(tabGroup.id, browserTabGroup)
}

/**
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser tab groups.
 */
export const registerChromeTabGroupEventHandlers = (): void => {
  if (!chrome.tabGroups) return

  chrome.tabGroups.onCreated.addListener(onChromeTabGroupCreated)
  chrome.tabGroups.onUpdated.addListener(onChromeTabGroupUpdated)
  chrome.tabGroups.onRemoved.addListener(onChromeTabGroupRemoved)
  chrome.tabGroups.onMoved.addListener(onChromeTabGroupMoved)
}

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
export const unregisterChromeTabGroupEventHandlers = (): void => {
  if (!chrome.tabGroups) return

  chrome.tabGroups.onCreated.removeListener(onChromeTabGroupCreated)
  chrome.tabGroups.onUpdated.removeListener(onChromeTabGroupUpdated)
  chrome.tabGroups.onRemoved.removeListener(onChromeTabGroupRemoved)
  chrome.tabGroups.onMoved.removeListener(onChromeTabGroupMoved)
}
