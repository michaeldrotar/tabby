import { createDefaultTabSelection } from './view'
import type { TabManagerView } from './view'
import type { BrowserSnapshot } from '@extension/core'

/** Seed the host window only while initialization has not been superseded by input. */
export const initializeTabManagerView = (
  view: TabManagerView,
  snapshot: BrowserSnapshot,
  currentWindowId?: number,
) => {
  const state = view.getState()
  if (
    state.selectionCleared ||
    state.hasUserInput ||
    state.focusedItem ||
    state.scrollTop
  )
    return
  const windowId =
    snapshot.windows.find((window) => window.id === currentWindowId)?.id ??
    snapshot.windows.find((window) => window.focused)?.id ??
    snapshot.windows[0]?.id
  if (windowId === undefined) return
  const active = snapshot.tabs.find(
    (tab) => tab.windowId === windowId && tab.active,
  )
  view.setState({
    viewedWindowId: windowId,
    focusedItem: null,
    selection: createDefaultTabSelection(snapshot, windowId),
    ...(active
      ? {
          scrollToItem: {
            id: active.id,
            revision: (state.scrollToItem?.revision ?? 0) + 1,
          },
        }
      : {}),
  })
}
