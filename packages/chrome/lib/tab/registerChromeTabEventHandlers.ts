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
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser tabs.
 */
export const registerChromeTabEventHandlers = (): void => {
  chrome.tabs.onActivated.addListener(onChromeTabActivated)
  chrome.tabs.onAttached.addListener(onChromeTabAttached)
  chrome.tabs.onCreated.addListener(onChromeTabCreated)
  chrome.tabs.onDetached.addListener(onChromeTabDetached)
  chrome.tabs.onHighlighted.addListener(onChromeTabHighlighted)
  chrome.tabs.onMoved.addListener(onChromeTabMoved)
  chrome.tabs.onRemoved.addListener(onChromeTabRemoved)
  chrome.tabs.onReplaced.addListener(onChromeTabReplaced)
  chrome.tabs.onUpdated.addListener(onChromeTabUpdated)
}
