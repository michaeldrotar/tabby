import { unregisterChromeTabEventHandlers } from './tab/tabEvents.js'
import { useBrowserStore } from './useBrowserStore.js'
import { unregisterChromeWindowEventHandlers } from './window/windowEvents.js'

/**
 * Unloads the lib and unregisters its event handlers.
 *
 * In practice, this isn't expected to be used, but it can handle returning
 * things to their initial state if something goes wrong.
 */
export const unloadBrowserStore = (): void => {
  const getState = useBrowserStore.getState
  if (getState().state === 'initial') return

  unregisterChromeWindowEventHandlers()
  unregisterChromeTabEventHandlers()

  const setState = useBrowserStore.setState
  setState({
    windowById: {},
    windowIds: [],
    currentWindowId: undefined,
    focusedWindowId: undefined,
    tabById: {},
    state: 'initial',
  })
}
