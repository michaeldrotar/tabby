import { onChromeWindowBoundsChanged } from './onChromeWindowBoundsChanged.js'
import { onChromeWindowCreated } from './onChromeWindowCreated.js'
import { onChromeWindowFocusChanged } from './onChromeWindowFocusChanged.js'
import { onChromeWindowRemoved } from './onChromeWindowRemoved.js'

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
