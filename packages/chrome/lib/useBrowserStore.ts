import { create } from 'zustand'
import type { BrowserTab } from './tab/BrowserTab.js'
import type { BrowserTabID } from './tab/BrowserTabID.js'
import type { BrowserWindow } from './window/BrowserWindow.js'
import type { BrowserWindowID } from './window/BrowserWindowID.js'

export type UseBrowserStoreState = {
  /**
   * The current loading state for this data.
   * - initial = initial state, not yet loaded
   * - loading = in the process of loading data
   * - loaded = data has loaded
   */
  state: 'initial' | 'loading' | 'loaded'

  // Windows
  windowById: Record<BrowserWindowID, BrowserWindow>
  windowIds: BrowserWindowID[]
  currentWindowId: BrowserWindowID | undefined
  focusedWindowId: BrowserWindowID | undefined

  // Tabs
  tabById: Record<BrowserTabID, BrowserTab>

  // Window Actions
  addWindow: (window: BrowserWindow) => void
  updateWindowById: (id: BrowserWindowID, data: Partial<BrowserWindow>) => void
  removeWindowById: (id: BrowserWindowID) => void

  // Tab Actions
  addTab: (tab: BrowserTab) => BrowserTab
  updateTabById: (
    id: BrowserTabID,
    data: Partial<BrowserTab>,
  ) => BrowserTab | undefined
  replaceTab: (tab: BrowserTab) => BrowserTab
  removeTabById: (id: BrowserTabID, options?: chrome.tabs.TabRemoveInfo) => void
  moveTabById: (id: BrowserTabID, options: { toIndex: number }) => void
}

export const useBrowserStore = create<UseBrowserStoreState>((set, get) => {
  return {
    state: 'initial',

    // Windows
    windowById: {},
    windowIds: [],
    currentWindowId: undefined,
    focusedWindowId: undefined,

    // Tabs
    tabById: {},

    // Window Actions
    addWindow: (newBrowserWindow) => {
      set((state) => ({
        windowById: {
          ...state.windowById,
          [newBrowserWindow.id]: newBrowserWindow,
        },
        windowIds: [...state.windowIds, newBrowserWindow.id],
      }))
    },

    updateWindowById: (id, data) => {
      const { windowById } = get()
      if (!windowById[id]) return

      const current = windowById[id]
      const updated: BrowserWindow = {
        ...current,
        ...data,
      }

      set({
        windowById: { ...windowById, [id]: updated },
      })
    },

    removeWindowById: (id) => {
      const { windowById, windowIds } = get()
      if (!windowById[id]) return

      const newWindowById = { ...windowById }
      delete newWindowById[id]

      set({
        windowById: newWindowById,
        windowIds: windowIds.filter((windowId) => windowId !== id),
      })
    },

    // Tab Actions
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

      set({
        tabById: { ...tabById, [id]: updated },
      })

      return updated
    },

    replaceTab: (browserTab) => {
      const { tabById } = get()
      const { id } = browserTab

      set({
        tabById: { ...tabById, [id]: browserTab },
      })

      return browserTab
    },

    removeTabById: (id, _removeInfo) => {
      const { tabById } = get()
      const browserTab = tabById[id]
      if (!browserTab) return

      const newTabById = { ...tabById }
      delete newTabById[id]

      set({
        tabById: newTabById,
      })
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

      set({
        tabById: newTabById,
      })
    },
  }
})
