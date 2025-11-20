import { onChromeTabActivated } from './onChromeTabActivated.js'
import { onChromeTabCreated } from './onChromeTabCreated.js'
import { onChromeTabMoved } from './onChromeTabMoved.js'
import { onChromeTabRemoved } from './onChromeTabRemoved.js'
import { onChromeTabUpdated } from './onChromeTabUpdated.js'

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
export const unregisterChromeTabEventHandlers = (): void => {
  chrome.tabs.onActivated.removeListener(onChromeTabActivated)
  chrome.tabs.onCreated.removeListener(onChromeTabCreated)
  chrome.tabs.onMoved.removeListener(onChromeTabMoved)
  chrome.tabs.onRemoved.removeListener(onChromeTabRemoved)
  chrome.tabs.onUpdated.removeListener(onChromeTabUpdated)
}
