import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Handles when a chrome window is closed.
 */
export const onChromeWindowRemoved = (removedId: BrowserWindowID): void => {
  const state = useBrowserWindowStore.getState()
  const setState = useBrowserWindowStore.setState

  setState({
    currentId: state.currentId === removedId ? undefined : state.currentId,
    focusedId: state.focusedId === removedId ? undefined : state.focusedId,
  })

  state.removeById(removedId)
}
