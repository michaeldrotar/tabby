import { BrowserWindows } from './BrowserWindows.js'
import { create } from 'zustand'
import type { BrowserWindow } from './BrowserWindow.js'

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

const loaded = () => {
  console.count('useBrowserWindowStore.loaded')
  const { all, byId, current, focused } = BrowserWindows
  useBrowserWindowsStore.setState({
    all: [...all],
    byId: { ...byId },
    current,
    focused,
  })
}

const updated = (updatedBrowserWindow: BrowserWindow) => {
  console.count('useBrowserWindowStore.updated')
  const state = useBrowserWindowsStore.getState()
  const existingWindow = state.all.find(
    (browserWindow) => browserWindow.id === updatedBrowserWindow.id,
  )
  if (!existingWindow) return
  const index = state.all.indexOf(existingWindow)
  const newWindow = {
    ...existingWindow,
    ...updatedBrowserWindow,
  }
  state.all.splice(index, 1, newWindow)
  state.byId[newWindow.id] = newWindow
  useBrowserWindowsStore.setState({
    all: [...state.all],
    byId: { ...state.byId },
  })
}

const listChanged = () => {
  console.count('useBrowserWindowStore.listChanged')
  const { all, byId } = BrowserWindows
  useBrowserWindowsStore.setState({
    all: [...all],
    byId: { ...byId },
  })
}

const currentChanged = () => {
  console.count('useBrowserWindowStore.currentChanged')
  const { current } = BrowserWindows
  useBrowserWindowsStore.setState({
    current,
  })
}

const focusedChanged = () => {
  console.count('useBrowserWindowStore.focusedChanged')
  const { focused } = BrowserWindows
  useBrowserWindowsStore.setState({
    focused,
  })
}

BrowserWindows.load().then(loaded)
BrowserWindows.onCurrentChanged.addListener(currentChanged)
BrowserWindows.onFocusedChanged.addListener(focusedChanged)
BrowserWindows.onListChanged.addListener(listChanged)
BrowserWindows.onUpdated.addListener(updated)
