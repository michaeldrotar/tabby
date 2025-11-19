import { useBrowserWindowStore } from './useBrowserWindowStore.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

/**
 * Handles when focus changes to a different chrome window.
 */
export const onChromeWindowFocusChanged = (
  newFocusedId: BrowserWindowID,
): void => {
  const state = useBrowserWindowStore.getState()
  if (state.focusedId === newFocusedId) return

  if (state.focusedId) {
    state.updateById(state.focusedId, { focused: false })
  }
  state.updateById(newFocusedId, { focused: true })

  useBrowserWindowStore.setState({
    focusedId: newFocusedId,
  })
}
