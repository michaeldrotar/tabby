import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
} from '@extension/core/selection/SelectionModel'
import { createStore } from 'zustand/vanilla'
import type { SelectionModelContext } from '@extension/core/selection/SelectionModel'
import type { TabManagerViewModel } from '@extension/ui/tab-manager/TabManager'

export type TabManagerViewState = {
  viewedWindowId: number | null
  selection: SelectionModelContext
  sidebarExpanded: boolean
  focusedItem: NonNullable<TabManagerViewModel['focusedItem']> | null
  hoveredItem: NonNullable<TabManagerViewModel['hoveredItem']> | null
  actionMenu: TabManagerViewModel['actionMenu']
  notice: TabManagerViewModel['notice']
  scrollTop: number
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
    sidebarExpanded: false,
    focusedItem: null,
    hoveredItem: null,
    actionMenu: null,
    notice: null,
    scrollTop: 0,
    ...structuredClone(initial),
  }))

export type TabManagerView = ReturnType<typeof createTabManagerView>
