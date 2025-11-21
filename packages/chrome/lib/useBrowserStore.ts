import { createTabGroupSlice } from './tabGroupSlice.js'
import { createTabSlice } from './tabSlice.js'
import { createWindowSlice } from './windowSlice.js'
import { create } from 'zustand'
import type { TabGroupSlice } from './tabGroupSlice.js'
import type { TabSlice } from './tabSlice.js'
import type { WindowSlice } from './windowSlice.js'

type LoadingStoreState = {
  /**
   * The current loading state for this data.
   * - initial = initial state, not yet loaded
   * - loading = in the process of loading data
   * - loaded = data has loaded
   */
  state: 'initial' | 'loading' | 'loaded'
}

export type UseBrowserStoreState = LoadingStoreState &
  WindowSlice &
  TabSlice &
  TabGroupSlice

/**
 * Provides the state of the browser.
 *
 * It is not recommended to use this directly. Use the other browser
 * hooks for best performance. They are optimized to only re-render
 * when their specific data is changed.
 */
export const useBrowserStore = create<UseBrowserStoreState>(
  (set, get, store) => ({
    state: 'initial',
    ...createWindowSlice(set, get, store),
    ...createTabSlice(set, get, store),
    ...createTabGroupSlice(set, get, store),
  }),
)
