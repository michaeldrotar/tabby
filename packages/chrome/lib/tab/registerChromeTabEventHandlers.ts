import { onChromeTabActivated } from './onChromeTabActivated.js'
import { onChromeTabCreated } from './onChromeTabCreated.js'
import { onChromeTabMoved } from './onChromeTabMoved.js'
import { onChromeTabRemoved } from './onChromeTabRemoved.js'
import { onChromeTabUpdated } from './onChromeTabUpdated.js'

/**
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser tabs.
 */
export const registerChromeTabEventHandlers = (): void => {
  chrome.tabs.onActivated.addListener(onChromeTabActivated)
  chrome.tabs.onCreated.addListener(onChromeTabCreated)
  chrome.tabs.onMoved.addListener(onChromeTabMoved)
  chrome.tabs.onRemoved.addListener(onChromeTabRemoved)
  chrome.tabs.onUpdated.addListener(onChromeTabUpdated)
}
