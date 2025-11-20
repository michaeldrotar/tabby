import { create } from 'zustand'
import type { BrowserTab } from './BrowserTab.js'
import type { BrowserTabID } from './BrowserTabID.js'
import type { BrowserWindowID } from '../window/BrowserWindowID.js'

export type UseBrowserTabStoreState = {
  /**
   * The current loading state for this data.
   * - initial = initial state, not yet loaded
   * - loading = in the process of loading data
   * - loaded = data has loaded
   */
  state: 'initial' | 'loading' | 'loaded'

  /**
   * Provides a list of all browser tabs.
   */
  all: BrowserTab[]

  /**
   * Provides an easy lookup for browser tabs by their IDs.
   */
  byId: Record<BrowserTabID, BrowserTab>

  /**
   * Provides an easy lookup for browser tabs by window ID.
   */
  byWindowId: Record<BrowserWindowID, BrowserTab[]>

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
      byWindowId: {},

      add: (newBrowserTab) => {
        set((state) => ({
          all: [...state.all, newBrowserTab],
          byId: { ...state.byId, [newBrowserTab.id]: newBrowserTab },
          byWindowId: {
            ...state.byWindowId,
            [newBrowserTab.windowId]: [
              ...(state.byWindowId[newBrowserTab.windowId] || []),
              newBrowserTab,
            ],
          },
        }))

        return newBrowserTab
      },

      updateById: (id, data) => {
        const { all, byId, byWindowId } = get()
        if (!byId[id]) return

        const current = byId[id]
        const updated: BrowserTab = { ...current, ...data }

        const newByWindowId = { ...byWindowId }
        if (current.windowId !== updated.windowId) {
          newByWindowId[current.windowId] = newByWindowId[
            current.windowId
          ].filter((tab) => {
            return tab.id !== id
          })
          if (newByWindowId[current.windowId].length === 0) {
            delete newByWindowId[current.windowId]
          }

          newByWindowId[updated.windowId] = [
            ...(newByWindowId[updated.windowId] || []),
            updated,
          ]
        } else {
          newByWindowId[updated.windowId] = newByWindowId[updated.windowId].map(
            (tab) => (tab.id === id ? updated : tab),
          )
        }

        set({
          all: all.map((tab) => (tab.id === id ? updated : tab)),
          byId: { ...byId, [id]: updated },
          byWindowId: newByWindowId,
        })

        return updated
      },

      replace: (browserTab) => {
        const { all, byId, byWindowId } = get()
        const { id, windowId } = browserTab

        set({
          all: all.map((tab) => (tab.id === id ? browserTab : tab)),
          byId: { ...byId, [id]: browserTab },
          byWindowId: {
            ...byWindowId,
            [windowId]: byWindowId[windowId].map((tab) => {
              return tab.id === id ? browserTab : tab
            }),
          },
        })

        return browserTab
      },

      removeById: (id, removeInfo) => {
        const { all, byId, byWindowId } = get()
        const browserTab = byId[id]
        if (!browserTab) return

        const windowId = removeInfo?.windowId || browserTab.windowId
        const newByWindowId = { ...byWindowId }
        newByWindowId[windowId] = newByWindowId[windowId].filter(
          (tab) => tab.id !== id,
        )
        if (newByWindowId[windowId].length === 0) {
          delete newByWindowId[windowId]
        }

        const newById = { ...byId }
        delete newById[id]

        set({
          all: all.filter((tab) => tab.id !== id),
          byId: newById,
          byWindowId: newByWindowId,
        })
      },

      moveById: (id, { toIndex }) => {
        const { all, byId, byWindowId } = get()
        const movedBrowserTab = byId[id]
        if (!movedBrowserTab) return

        const fromIndex = movedBrowserTab.index
        const windowId = movedBrowserTab.windowId

        const newAll: BrowserTab[] = []
        const newById: Record<BrowserTabID, BrowserTab> = {}
        const newByWindowId = { ...byWindowId }
        newByWindowId[windowId] = []

        const add = (tab: BrowserTab) => {
          newAll.push(tab)
          newById[tab.id] = tab
          if (tab.windowId === windowId) {
            newByWindowId[windowId].push(tab)
          }
        }

        all.forEach((tab) => {
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

        newByWindowId[windowId].sort((tabA, tabB) => {
          return tabA.index - tabB.index
        })

        set({
          all: newAll,
          byId: newById,
          byWindowId: newByWindowId,
        })
      },
    }
  },
)
