import { onChromeTabActivated } from './onChromeTabActivated.js'
import { onChromeTabAttached } from './onChromeTabAttached.js'
import { onChromeTabCreated } from './onChromeTabCreated.js'
import { onChromeTabDetached } from './onChromeTabDetached.js'
import { onChromeTabHighlighted } from './onChromeTabHighlighted.js'
import { onChromeTabMoved } from './onChromeTabMoved.js'
import { onChromeTabRemoved } from './onChromeTabRemoved.js'
import { onChromeTabReplaced } from './onChromeTabReplaced.js'
import { onChromeTabUpdated } from './onChromeTabUpdated.js'

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
export const unregisterChromeTabEventHandlers = (): void => {
  chrome.tabs.onActivated.removeListener(onChromeTabActivated)
  chrome.tabs.onAttached.removeListener(onChromeTabAttached)
  chrome.tabs.onCreated.removeListener(onChromeTabCreated)
  chrome.tabs.onDetached.removeListener(onChromeTabDetached)
  chrome.tabs.onHighlighted.removeListener(onChromeTabHighlighted)
  chrome.tabs.onMoved.removeListener(onChromeTabMoved)
  chrome.tabs.onRemoved.removeListener(onChromeTabRemoved)
  chrome.tabs.onReplaced.removeListener(onChromeTabReplaced)
  chrome.tabs.onUpdated.removeListener(onChromeTabUpdated)
}
