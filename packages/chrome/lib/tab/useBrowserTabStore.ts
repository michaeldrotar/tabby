import { create } from 'zustand'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'

export type UseBrowserTabStoreState = {
  /**
   * The current loading state for this data.
   * - initial = initial state, not yet loaded
   * - loading = in the process of loading data
   * - loaded = data has loaded
   */
  state: 'initial' | 'loading' | 'loaded'

  /**
   * Provides an easy lookup for browser tabs by their IDs.
   */
  byId: Record<BrowserTabID, BrowserTab>

  /**
   * Adds a browser tab to all collections of the store.
   */
  add: (newBrowserTab: BrowserTab) => BrowserTab

  /**
   * Updates a browser tab's state across all collections in the store.
   */
  updateById: (
    id: BrowserTabID,
    data: Partial<BrowserTab>,
  ) => BrowserTab | undefined

  /**
   * Swaps a matching browser tab with the given one across all collections,
   * matching by id.
   */
  replace: (browserTab: BrowserTab) => BrowserTab

  /**
   * Removes a browser tab from all collections in the store.
   */
  removeById: (id: BrowserTabID, options?: chrome.tabs.TabRemoveInfo) => void

  /**
   * Moves a tab within byWindowId by shifting indexes.
   */
  moveById: (id: BrowserTabID, options: { toIndex: number }) => void
}

/**
 * Provides the state of browser tabs.
 *
 * It is not recommended to use this directly. Use the other browser tab
 * hooks for best performance. They are optimized to only re-render when
 * their specific data is changed.
 */
export const useBrowserTabStore = create<UseBrowserTabStoreState>(
  (set, get) => {
    return {
      state: 'initial',

      all: [],
      byId: {},

      add: (newBrowserTab) => {
        set((state) => ({
          byId: { ...state.byId, [newBrowserTab.id]: newBrowserTab },
        }))

        return newBrowserTab
      },

      updateById: (id, data) => {
        const { byId } = get()
        if (!byId[id]) return

        const current = byId[id]
        const updated: BrowserTab = { ...current, ...data }

        set({
          byId: { ...byId, [id]: updated },
        })

        return updated
      },

      replace: (browserTab) => {
        const { byId } = get()
        const { id } = browserTab

        set({
          byId: { ...byId, [id]: browserTab },
        })

        return browserTab
      },

      removeById: (id, _removeInfo) => {
        const { byId } = get()
        const browserTab = byId[id]
        if (!browserTab) return

        const newById = { ...byId }
        delete newById[id]

        set({
          byId: newById,
        })
      },

      moveById: (id, { toIndex }) => {
        const { byId } = get()
        const movedBrowserTab = byId[id]
        if (!movedBrowserTab) return

        const fromIndex = movedBrowserTab.index
        const windowId = movedBrowserTab.windowId

        const newById: Record<BrowserTabID, BrowserTab> = {}

        const add = (tab: BrowserTab) => {
          newById[tab.id] = tab
        }

        Object.values(byId).forEach((tab) => {
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

        set({
          byId: newById,
        })
      },
    }
  },
)
