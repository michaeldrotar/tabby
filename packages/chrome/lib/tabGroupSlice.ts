import type { BrowserTabGroup } from './tabGroup/BrowserTabGroup.js'
import type { BrowserTabGroupID } from './tabGroup/BrowserTabGroupID.js'
import type { StateCreator } from 'zustand'

export type TabGroupSlice = {
  /**
   * Provides an easy lookup for browser tab groups by their IDs.
   */
  tabGroupById: Record<BrowserTabGroupID, BrowserTabGroup>

  /**
   * Adds a browser tab group to the store.
   */
  addTabGroup: (newBrowserTabGroup: BrowserTabGroup) => BrowserTabGroup

  /**
   * Updates a browser tab group's state within the store.
   */
  updateTabGroupById: (
    id: BrowserTabGroupID,
    data: Partial<BrowserTabGroup>,
  ) => BrowserTabGroup | undefined

  /**
   * Replaces a browser tab group's state within the store.
   */
  replaceTabGroup: (browserTabGroup: BrowserTabGroup) => BrowserTabGroup

  /**
   * Removes a browser tab group from the store.
   */
  removeTabGroupById: (id: BrowserTabGroupID) => void
}

export const createTabGroupSlice: StateCreator<TabGroupSlice> = (set, get) => ({
  tabGroupById: {},

  addTabGroup: (newBrowserTabGroup) => {
    set((state) => ({
      tabGroupById: {
        ...state.tabGroupById,
        [newBrowserTabGroup.id]: newBrowserTabGroup,
      },
    }))
    return newBrowserTabGroup
  },

  updateTabGroupById: (id, data) => {
    const { tabGroupById } = get()
    if (!tabGroupById[id]) return
    const current = tabGroupById[id]
    const updated: BrowserTabGroup = { ...current, ...data }
    set({ tabGroupById: { ...tabGroupById, [id]: updated } })
    return updated
  },

  replaceTabGroup: (browserTabGroup) => {
    const { tabGroupById } = get()
    const { id } = browserTabGroup
    set({ tabGroupById: { ...tabGroupById, [id]: browserTabGroup } })
    return browserTabGroup
  },

  removeTabGroupById: (id) => {
    const { tabGroupById } = get()
    const browserTabGroup = tabGroupById[id]
    if (!browserTabGroup) return
    const newTabGroupById = { ...tabGroupById }
    delete newTabGroupById[id]
    set({ tabGroupById: newTabGroupById })
  },
})
