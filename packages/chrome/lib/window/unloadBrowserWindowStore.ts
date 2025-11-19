import { unregisterChromeWindowEventHandlers } from './unregisterChromeWindowEventHandlers.js'
import { useBrowserWindowStore } from './useBrowserWindowStore.js'

/**
 * Unloads the lib and unregisters its event handlers.
 *
 * In practice, this isn't expected to be used, but it can handle returning
 * things to their initial state if something goes wrong.
 */
export const unloadBrowserWindowStore = (): void => {
  const getState = useBrowserWindowStore.getState
  if (getState().state === 'initial') return

  unregisterChromeWindowEventHandlers()

  const setState = useBrowserWindowStore.setState
  setState({
    all: [],
    byId: {},
    currentId: undefined,
    focusedId: undefined,
    state: 'initial',
  })
}
