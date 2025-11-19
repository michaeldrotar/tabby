import { browserWindowTypes } from './browserWindowTypes.js'
import { onChromeWindowBoundsChanged } from './onChromeWindowBoundsChanged.js'
import { onChromeWindowCreated } from './onChromeWindowCreated.js'
import { onChromeWindowFocusChanged } from './onChromeWindowFocusChanged.js'
import { onChromeWindowRemoved } from './onChromeWindowRemoved.js'

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
