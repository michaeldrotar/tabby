import { BrowserWindows } from './BrowserWindows.js'
import { create } from 'zustand'

type BrowserWindowStoreState = {
  all: typeof BrowserWindows.all
  byId: typeof BrowserWindows.byId
  current: typeof BrowserWindows.current
  focused: typeof BrowserWindows.focused
}

/**
 * Provides a full state object to React that is based on the BrowserWindows lib.
 *
 * It is not recommended to use this directly. Use the other browser window
 * hooks for best performance. They are optimized to only re-render when
 * their specific data is changed.
 */
export const useBrowserWindowsStore = create<BrowserWindowStoreState>(() => ({
  all: [],
  byId: {},
  current: undefined,
  focused: undefined,
}))

const update = () => {
  const { all, byId, current, focused } = BrowserWindows
  useBrowserWindowsStore.setState({
    all,
    byId,
    current,
    focused,
  })
}

BrowserWindows.load().then(update)
BrowserWindows.onUpdated.addListener(update)
