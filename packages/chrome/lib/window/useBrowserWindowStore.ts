import { create } from 'zustand'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

export type UseBrowserWindowStoreState = {
  /**
   * The current loading state for this data.
   * - initial = initial state, not yet loaded
   * - loading = in the process of loading data
   * - loaded = data has loaded
   */
  state: 'initial' | 'loading' | 'loaded'

  /**
   * Provides a list of all browser windows.
   */
  all: BrowserWindow[]

  /**
   * Provides an easy lookup for browser windows by their IDs.
   */
  byId: Record<BrowserWindowID, BrowserWindow>

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
  currentId: BrowserWindowID | undefined

  /**
   * Provides the ID of the focused browser window.
   *
   * This may be `undefined` if there are no focused browser windows.
   * Or the focused window may be one that isn't tracked by this,
   * such as a devtools window.
   */
  focusedId: BrowserWindowID | undefined

  /**
   * Adds a browser window to the store, updating the `all` and `byId` lists.
   *
   * Does not provide any additional logic or evaluation, such as changing the
   * focusedId if the newly added window is also focused.
   */
  add: (newBrowserWindow: BrowserWindow) => void

  /**
   * Updates a browser window's state in the store.
   *
   * Does not provide any additional logic or evaluation, such as changing the
   * focusedId if the updated window is focused.
   */
  updateById: (id: BrowserWindowID, data: Partial<BrowserWindow>) => void

  /**
   * Removes a browser window from the store.
   *
   * Does not provide any additional logic or evaluation, such as unsetting
   * the focusedId if the focused window is removed.
   */
  removeById: (id: BrowserWindowID) => void
}

/**
 * Provides the state of browser windows.
 *
 * It is not recommended to use this directly. Use the other browser window
 * hooks for best performance. They are optimized to only re-render when
 * their specific data is changed.
 */
export const useBrowserWindowStore = create<UseBrowserWindowStoreState>(
  (set, get) => {
    return {
      state: 'initial',

      all: [],
      byId: {},
      currentId: undefined,
      focusedId: undefined,

      add: (newBrowserWindow) => {
        set((state) => ({
          all: [...state.all, newBrowserWindow],
          byId: { ...state.byId, [newBrowserWindow.id]: newBrowserWindow },
        }))
      },

      updateById: (id, data) => {
        const { all, byId } = get()
        if (!byId[id]) return

        const newBrowserWindow: BrowserWindow = {
          ...byId[id],
          ...data,
        }

        set({
          all: all.map((w) =>
            w.id === newBrowserWindow.id ? newBrowserWindow : w,
          ),
          byId: { ...byId, [newBrowserWindow.id]: newBrowserWindow },
        })
      },

      removeById: (id) => {
        const { all, byId } = get()
        if (!byId[id]) return

        const newById = { ...byId }
        delete newById[id]

        set({
          all: all.filter((w) => w.id !== id),
          byId: newById,
        })
      },
    }
  },
)
