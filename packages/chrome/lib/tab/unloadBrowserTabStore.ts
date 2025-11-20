import { unregisterChromeTabEventHandlers } from './unregisterChromeTabEventHandlers.js'
import { useBrowserTabStore } from './useBrowserTabStore.js'

/**
 * Unloads the lib and unregisters its event handlers.
 *
 * In practice, this isn't expected to be used, but it can handle returning
 * things to their initial state if something goes wrong.
 */
export const unloadBrowserTabStore = (): void => {
  const getState = useBrowserTabStore.getState
  if (getState().state === 'initial') return

  unregisterChromeTabEventHandlers()

  const setState = useBrowserTabStore.setState
  setState({
    all: [],
    byId: {},
    byWindowId: {},
    state: 'initial',
  })
}
