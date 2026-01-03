import { create } from 'zustand'

/**
 * Selection mode for keyboard navigation.
 * - 'default': Finder-style - arrow keys move focus AND select single item
 * - 'multi-select': Focus and selection are independent, Space toggles selection
 */
export type SelectionMode = 'default' | 'multi-select'

export type SelectionState = {
  windowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>
  mode: SelectionMode
}

export type SelectionActions = {
  // Single-item setters (clear others, select only this)
  setWindow: (id: number) => void
  setGroup: (id: number) => void
  setTab: (id: number) => void

  // Bulk setters (clear others, select all provided)
  setWindows: (ids: number[]) => void
  setGroups: (ids: number[]) => void
  setTabs: (ids: number[]) => void

  // Single-item adders (add to existing selection)
  addWindow: (id: number) => void
  addGroup: (id: number) => void
  addTab: (id: number) => void

  // Bulk adders (add all to existing selection)
  addWindows: (ids: number[]) => void
  addGroups: (ids: number[]) => void
  addTabs: (ids: number[]) => void

  // Single-item removers
  removeWindow: (id: number) => void
  removeGroup: (id: number) => void
  removeTab: (id: number) => void

  // Bulk removers
  removeWindows: (ids: number[]) => void
  removeGroups: (ids: number[]) => void
  removeTabs: (ids: number[]) => void

  // Clear all selection
  clear: () => void

  // Mode management
  enterMultiSelectMode: () => void
  exitMultiSelectMode: () => void
}

export type SelectionStore = SelectionState & SelectionActions

const initialState: SelectionState = {
  windowIds: new Set(),
  groupIds: new Set(),
  tabIds: new Set(),
  mode: 'default',
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  ...initialState,

  // Single-item setters
  setWindow: (id) =>
    set({
      windowIds: new Set([id]),
      groupIds: new Set(),
      tabIds: new Set(),
    }),

  setGroup: (id) =>
    set({
      windowIds: new Set(),
      groupIds: new Set([id]),
      tabIds: new Set(),
    }),

  setTab: (id) =>
    set({
      windowIds: new Set(),
      groupIds: new Set(),
      tabIds: new Set([id]),
    }),

  // Bulk setters
  setWindows: (ids) =>
    set({
      windowIds: new Set(ids),
      groupIds: new Set(),
      tabIds: new Set(),
    }),

  setGroups: (ids) =>
    set({
      windowIds: new Set(),
      groupIds: new Set(ids),
      tabIds: new Set(),
    }),

  setTabs: (ids) =>
    set({
      windowIds: new Set(),
      groupIds: new Set(),
      tabIds: new Set(ids),
    }),

  // Single-item adders
  addWindow: (id) =>
    set((state) => ({
      windowIds: new Set([...state.windowIds, id]),
    })),

  addGroup: (id) =>
    set((state) => ({
      groupIds: new Set([...state.groupIds, id]),
    })),

  addTab: (id) =>
    set((state) => ({
      tabIds: new Set([...state.tabIds, id]),
    })),

  // Bulk adders
  addWindows: (ids) =>
    set((state) => ({
      windowIds: new Set([...state.windowIds, ...ids]),
    })),

  addGroups: (ids) =>
    set((state) => ({
      groupIds: new Set([...state.groupIds, ...ids]),
    })),

  addTabs: (ids) =>
    set((state) => ({
      tabIds: new Set([...state.tabIds, ...ids]),
    })),

  // Single-item removers
  removeWindow: (id) =>
    set((state) => {
      const newSet = new Set(state.windowIds)
      newSet.delete(id)
      return { windowIds: newSet }
    }),

  removeGroup: (id) =>
    set((state) => {
      const newSet = new Set(state.groupIds)
      newSet.delete(id)
      return { groupIds: newSet }
    }),

  removeTab: (id) =>
    set((state) => {
      const newSet = new Set(state.tabIds)
      newSet.delete(id)
      return { tabIds: newSet }
    }),

  // Bulk removers
  removeWindows: (ids) =>
    set((state) => {
      const newSet = new Set(state.windowIds)
      ids.forEach((id) => newSet.delete(id))
      return { windowIds: newSet }
    }),

  removeGroups: (ids) =>
    set((state) => {
      const newSet = new Set(state.groupIds)
      ids.forEach((id) => newSet.delete(id))
      return { groupIds: newSet }
    }),

  removeTabs: (ids) =>
    set((state) => {
      const newSet = new Set(state.tabIds)
      ids.forEach((id) => newSet.delete(id))
      return { tabIds: newSet }
    }),

  // Clear all
  clear: () =>
    set({
      windowIds: new Set(),
      groupIds: new Set(),
      tabIds: new Set(),
    }),

  // Mode management
  enterMultiSelectMode: () => set({ mode: 'multi-select' }),
  exitMultiSelectMode: () => set({ mode: 'default' }),
}))
