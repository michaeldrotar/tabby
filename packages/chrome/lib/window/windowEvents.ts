import { browserWindowTypes } from './browserWindowTypes.js'
import { toBrowserWindow } from './toBrowserWindow.js'
import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Handles when the bounds or state of a chrome window are changed.
 *
 * If the user is dragging a window to resize it, this may not
 * fire until they release the window.
 */
const onChromeWindowBoundsChanged = (
  updatedChromeWindow: chrome.windows.Window,
): void => {
  const updatedBrowserWindow = toBrowserWindow(updatedChromeWindow)
  if (!updatedBrowserWindow) return

  const state = useBrowserStore.getState()
  state.updateWindowById(updatedBrowserWindow.id, updatedBrowserWindow)
}

/**
 * Handles when a new chrome window is opened.
 */
const onChromeWindowCreated = (
  newChromeWindow: chrome.windows.Window,
): void => {
  const newBrowserWindow = toBrowserWindow(newChromeWindow)
  if (!newBrowserWindow) return
  const state = useBrowserStore.getState()
  state.addWindow(newBrowserWindow)
}

/**
 * Handles when focus changes to a different chrome window.
 */
const onChromeWindowFocusChanged = (newFocusedId: BrowserWindowID): void => {
  const state = useBrowserStore.getState()
  if (state.focusedWindowId === newFocusedId) return

  if (state.focusedWindowId) {
    state.updateWindowById(state.focusedWindowId, { focused: false })
  }
  state.updateWindowById(newFocusedId, { focused: true })

  useBrowserStore.setState({
    focusedWindowId: newFocusedId,
  })
}

/**
 * Handles when a chrome window is closed.
 */
const onChromeWindowRemoved = (removedId: BrowserWindowID): void => {
  const state = useBrowserStore.getState()
  const setState = useBrowserStore.setState

  setState({
    currentWindowId:
      state.currentWindowId === removedId ? undefined : state.currentWindowId,
    focusedWindowId:
      state.focusedWindowId === removedId ? undefined : state.focusedWindowId,
  })

  state.removeWindowById(removedId)
}

/**
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser windows.
 */
export const registerChromeWindowEventHandlers = (): void => {
  chrome.windows.onBoundsChanged.addListener(onChromeWindowBoundsChanged)
  chrome.windows.onCreated.addListener(onChromeWindowCreated, {
    windowTypes: browserWindowTypes,
  })
  chrome.windows.onFocusChanged.addListener(onChromeWindowFocusChanged, {
    windowTypes: browserWindowTypes,
  })
  chrome.windows.onRemoved.addListener(onChromeWindowRemoved, {
    windowTypes: browserWindowTypes,
  })
}

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
export const unregisterChromeWindowEventHandlers = (): void => {
  chrome.windows.onBoundsChanged.removeListener(onChromeWindowBoundsChanged)
  chrome.windows.onCreated.removeListener(onChromeWindowCreated)
  chrome.windows.onFocusChanged.removeListener(onChromeWindowFocusChanged)
  chrome.windows.onRemoved.removeListener(onChromeWindowRemoved)
}
