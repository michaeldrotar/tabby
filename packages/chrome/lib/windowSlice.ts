import type { BrowserWindow } from './window/BrowserWindow.js'
import type { BrowserWindowID } from './window/BrowserWindowID.js'
import type { StateCreator } from 'zustand'

export type WindowSlice = {
  /**
   * Provides an easy lookup for browser windows by their IDs.
   */
  windowById: Record<BrowserWindowID, BrowserWindow>

  /**
   * Provides a list of all browser window IDs in their creation order.
   */
  windowIds: BrowserWindowID[]

  /**
   * Provides the ID of the current browser window.
   *
   * This is the window which owns the current version of the script. So if
   * the side panel is open in 10 windows, there are 10 versions of this
   * script running, and each one will have a different current
   * browser window that owns it.
   *
   * In practice, this should always have a value once loading has finished.
   */
  currentWindowId: BrowserWindowID | undefined

  /**
   * Provides the ID of the focused browser window.
   *
   * This may be `undefined` if there are no focused browser windows.
   * Or the focused window may be one that isn't tracked by this,
   * such as a devtools window.
   */
  focusedWindowId: BrowserWindowID | undefined

  /**
   * Adds a browser window the store.
   */
  addWindow: (newBrowserWindow: BrowserWindow) => void

  /**
   * Updates a browser window's state within the store.
   */
  updateWindowById: (id: BrowserWindowID, data: Partial<BrowserWindow>) => void

  /**
   * Removes a browser window from the store.
   */
  removeWindowById: (id: BrowserWindowID) => void
}

export const createWindowSlice: StateCreator<WindowSlice> = (set, get) => ({
  windowById: {},
  windowIds: [],
  currentWindowId: undefined,
  focusedWindowId: undefined,

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
    const updated: BrowserWindow = { ...current, ...data }
    set({ windowById: { ...windowById, [id]: updated } })
  },

  removeWindowById: (id) => {
    const { windowById, windowIds } = get()
    if (!windowById[id]) return
    const newWindowById = { ...windowById }
    delete newWindowById[id]
    set({
      windowById: newWindowById,
      windowIds: windowIds.filter((wid) => wid !== id),
    })
  },
})
