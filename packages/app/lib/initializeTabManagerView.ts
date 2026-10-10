import { reduceSelectionIntent } from '@extension/core'
import type { TabManagerView } from './view'
import type { BrowserSnapshot } from '@extension/core'

/** Seed the host window only while initialization has not been superseded by input. */
export const initializeTabManagerView = (
  view: TabManagerView,
  snapshot: BrowserSnapshot,
  currentWindowId?: number,
) => {
  const state = view.getState()
  const selection = state.selection.selection
  if (
    selection.windowIds.size ||
    selection.groupIds.size ||
    selection.tabIds.size ||
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
    focusedItem: { type: 'window', id: windowId },
    selection: reduceSelectionIntent(state.selection, {
      type: 'arrow',
      item: { type: 'window', id: windowId },
      pane: 'window',
      forceSingleSelect: true,
    }),
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
