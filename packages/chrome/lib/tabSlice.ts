import type { BrowserTab } from './tab/BrowserTab.js'
import type { BrowserTabID } from './tab/BrowserTabID.js'
import type { StateCreator } from 'zustand'

export type TabSlice = {
  /**
   * Provides an easy lookup for browser tabs by their IDs.
   */
  tabById: Record<BrowserTabID, BrowserTab>

  /**
   * Adds a browser tab to the store.
   */
  addTab: (newBrowserTab: BrowserTab) => BrowserTab

  /**
   * Updates a browser tab's state within the store.
   */
  updateTabById: (
    id: BrowserTabID,
    data: Partial<BrowserTab>,
  ) => BrowserTab | undefined

  /**
   * Replaces a browser tab's state within the store.
   */
  replaceTab: (browserTab: BrowserTab) => BrowserTab

  /**
   * Removes a browser tab from the store.
   */
  removeTabById: (id: BrowserTabID, options?: chrome.tabs.TabRemoveInfo) => void

  /**
   * Moves a tab within byWindowId by shifting indexes.
   */
  moveTabById: (id: BrowserTabID, options: { toIndex: number }) => void
}

export const createTabSlice: StateCreator<TabSlice> = (set, get) => ({
  tabById: {},

  addTab: (newBrowserTab) => {
    set((state) => ({
      tabById: { ...state.tabById, [newBrowserTab.id]: newBrowserTab },
    }))
    return newBrowserTab
  },

  updateTabById: (id, data) => {
    const { tabById } = get()
    if (!tabById[id]) return
    const current = tabById[id]
    const updated: BrowserTab = { ...current, ...data }
    set({ tabById: { ...tabById, [id]: updated } })
    return updated
  },

  replaceTab: (browserTab) => {
    const { tabById } = get()
    const { id } = browserTab
    set({ tabById: { ...tabById, [id]: browserTab } })
    return browserTab
  },

  removeTabById: (id, _removeInfo) => {
    const { tabById } = get()
    const browserTab = tabById[id]
    if (!browserTab) return
    const newTabById = { ...tabById }
    delete newTabById[id]
    set({ tabById: newTabById })
  },

  moveTabById: (id, { toIndex }) => {
    const { tabById } = get()
    const movedBrowserTab = tabById[id]
    if (!movedBrowserTab) return

    const fromIndex = movedBrowserTab.index
    const windowId = movedBrowserTab.windowId

    const newTabById: Record<BrowserTabID, BrowserTab> = {}
    const add = (tab: BrowserTab) => {
      newTabById[tab.id] = tab
    }

    Object.values(tabById).forEach((tab) => {
      if (tab.id === id) {
        return add({ ...tab, index: toIndex })
      }
      if (tab.windowId === windowId) {
        if (fromIndex < toIndex) {
          if (tab.index > fromIndex && tab.index <= toIndex) {
            return add({ ...tab, index: tab.index - 1 })
          }
        } else if (fromIndex > toIndex) {
          if (tab.index < fromIndex && tab.index >= toIndex) {
            return add({ ...tab, index: tab.index + 1 })
          }
        }
      }
      return add(tab)
    })

    set({ tabById: newTabById })
  },
})
