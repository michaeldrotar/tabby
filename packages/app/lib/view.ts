import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
} from '@extension/core/selection/SelectionModel'
import { createStore } from 'zustand/vanilla'
import { createNotificationState } from './notifications'
import type { NotificationState } from './notifications'
import type { SelectionModelContext } from '@extension/core/selection/SelectionModel'
import type { TabManagerViewModel } from '@extension/ui/tab-manager/TabManager'

export type TabManagerViewState = {
  viewedWindowId: number | null
  selection: SelectionModelContext
  sidebarExpanded: boolean | null
  focusedItem: NonNullable<TabManagerViewModel['focusedItem']> | null
  hoveredItem: NonNullable<TabManagerViewModel['hoveredItem']> | null
  actionMenu: TabManagerViewModel['actionMenu']
  notifications: NotificationState
  scrollTop: number
  actionPanel: TabManagerViewModel['actionPanel']
  renamingGroupId: number | null
  renamingGroupTitle: string | null
  scrollToItem: { id: number; revision: number } | null
}

export const createTabManagerView = (
  initial: Partial<TabManagerViewState> = {},
) =>
  createStore<TabManagerViewState>()(() => ({
    viewedWindowId: null,
    selection: {
      selection: { ...createEmptySelectionSnapshot(), mode: 'default' },
      interaction: createSelectionInteractionState(),
    },
    sidebarExpanded: null,
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
