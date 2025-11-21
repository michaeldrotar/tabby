import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Handles when a chrome window is closed.
 */
export const onChromeWindowRemoved = (removedId: BrowserWindowID): void => {
  const state = useBrowserStore.getState()
  const setState = useBrowserStore.setState

  setState({
    currentWindowId:
      state.currentWindowId === removedId ? undefined : state.currentWindowId,
    focusedWindowId:
      state.focusedWindowId === removedId ? undefined : state.focusedWindowId,
  })

  state.removeWindowById(removedId)
}
