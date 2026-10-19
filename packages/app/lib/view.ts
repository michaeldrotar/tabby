import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
  reduceSelectionIntent,
} from '@extension/core/selection/SelectionModel'
import { createStore } from 'zustand/vanilla'
import { createNotificationState } from './notifications'
import type { NotificationState } from './notifications'
import type { BrowserSnapshot, BrowserTabGroupColor } from '@extension/core'
import type { SelectionModelContext } from '@extension/core/selection/SelectionModel'
import type { TabManagerViewModel } from '@extension/ui/tab-manager/TabManager'

export type TabManagerViewState = {
  viewedWindowId: number | null
  windowPicker: boolean
  editingWindow: {
    windowId: number
    useCustom?: boolean
    name: string
    icon?: string
    iconColor?: BrowserTabGroupColor
  } | null
  hasUserInput: boolean
  selectionCleared: boolean
  selection: SelectionModelContext
  focusedItem: NonNullable<TabManagerViewModel['focusedItem']> | null
  hoveredItem: NonNullable<TabManagerViewModel['hoveredItem']> | null
  actionMenu: TabManagerViewModel['actionMenu']
  notifications: NotificationState
  scrollTop: number
  actionPanel: TabManagerViewModel['actionPanel']
  renamingGroupId: number | null
  renamingGroupTitle: string | null
  scrollToItem: { id: number; revision: number; focus?: boolean } | null
}

export const createTabManagerView = (
  initial: Partial<TabManagerViewState> = {},
) =>
  createStore<TabManagerViewState>()(() => ({
    viewedWindowId: null,
    windowPicker: false,
    editingWindow: null,
    hasUserInput:
      !!initial.selection || !!initial.focusedItem || !!initial.scrollTop,
    selectionCleared: false,
    selection: {
      selection: { ...createEmptySelectionSnapshot(), mode: 'default' },
      interaction: createSelectionInteractionState(),
    },
    focusedItem: null,
    hoveredItem: null,
    actionMenu: null,
    notifications: createNotificationState(),
    scrollTop: 0,
    actionPanel: null,
    renamingGroupId: null,
    renamingGroupTitle: null,
    scrollToItem: null,
    ...structuredClone(initial),
  }))

export type TabManagerView = ReturnType<typeof createTabManagerView>

export const createDefaultTabSelection = (
  snapshot: BrowserSnapshot,
  windowId: number | null,
): SelectionModelContext => {
  const tabs = snapshot.tabs.filter((tab) => tab.windowId === windowId)
  const active =
    tabs.find((tab) => tab.active) ??
    tabs.toSorted((a, b) => a.index - b.index)[0]
  const empty = {
    selection: { ...createEmptySelectionSnapshot(), mode: 'default' as const },
    interaction: createSelectionInteractionState(),
  }
  return active
    ? reduceSelectionIntent(
        empty,
        {
          type: 'arrow',
          item: { type: 'tab', id: active.id },
          pane: 'tab',
          forceSingleSelect: true,
        },
        snapshot,
      )
    : empty
}
