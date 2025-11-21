import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Handles when focus changes to a different chrome window.
 */
export const onChromeWindowFocusChanged = (
  newFocusedId: BrowserWindowID,
): void => {
  const state = useBrowserStore.getState()
  if (state.focusedWindowId === newFocusedId) return

  if (state.focusedWindowId) {
    state.updateWindowById(state.focusedWindowId, { focused: false })
  }
  state.updateWindowById(newFocusedId, { focused: true })

  useBrowserStore.setState({
    focusedWindowId: newFocusedId,
  })
}
