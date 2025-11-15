import { createEvent } from './createEvent.js'
import type { BrowserWindow } from './BrowserWindow.js'
import type { BrowserWindowID } from './BrowserWindowID.js'

const windowTypesToRegister: chrome.windows.windowTypeEnum[] = ['normal']

const onBrowserWindowListChanged = createEvent('listChanged')
const onBrowserWindowUpdated = createEvent('updated')
const onCurrentBrowserWindowChanged = createEvent('currentChanged')
const onFocusedBrowserWindowChanged = createEvent('focusedChanged')

/**
 * Converts a chrome.windows.Window to a BrowserWindow.
 *
 * If unable, logs a warning and returns undefined. In practice, that is
 * never expected to happen because all visible windows that this lib
 * works with should all have IDs. Only the session API should
 * return chrome.windows.Window objects without IDs.
 */
const toBrowserWindow = async (
  chromeWindow: chrome.windows.Window,
): Promise<BrowserWindow | undefined> => {
  if (chromeWindow.id === undefined || chromeWindow.id < 0) {
    console.warn(
      `BrowserWindows.toBrowserWindow got a window with a bad id ${chromeWindow.id}, skipping...`,
    )
    return undefined
  }
  return {
    id: chromeWindow.id,
    ...chromeWindow,
  }
}

/**
 * Gets all windows and converst them to BrowserWindow.
 */
const getAllWindows = async () => {
  const allChromeWindows = await chrome.windows.getAll()
  const allBrowserWindows = await Promise.all(
    allChromeWindows.map(toBrowserWindow),
  )
  return allBrowserWindows.filter(
    (browserWindow) => browserWindow !== undefined,
  )
}

/**
 * Gets the current window and converts it to a BrowserWindow.
 */
const getCurrentWindow = async () => {
  const chromeWindow = await chrome.windows.getCurrent()
  const browserWindow = await toBrowserWindow(chromeWindow)
  return browserWindow
}

/**
 * Data structure for inspecting browser windows.
 */
export const BrowserWindows = {
  /**
   * The current loading state for this data.
   * - initial = initial state, not yet loaded
   * - loading = in the process of loading data
   * - loaded = data has loaded
   */
  state: 'initial' as 'initial' | 'loading' | 'loaded',

  /**
   * Provides a list of all browser windows.
   */
  all: [] as BrowserWindow[],

  /**
   * Provides an easy lookup for browser windows by their IDs.
   */
  byId: {} as Record<BrowserWindowID, BrowserWindow>,

  /**
   * Provides quick access to the current browser window.
   *
   * This is the window which owns the current version of the script. So if
   * the side panel is open in 10 windows, there are 10 versions of this
   * script running, and each one will have a different current
   * browser window that owns it.
   *
   * In practice, this should always have a value once loading has finished.
   */
  current: undefined as BrowserWindow | undefined,

  /**
   * Provides quick access to the focused browser window.
   *
   * This may be `undefined` if there are no focused browser windows.
   * Or the focused window may be one that isn't tracked by this,
   * such as a devtools window.
   */
  focused: undefined as BrowserWindow | undefined,

  /**
   * Loads the lib and registers all its event handlers.
   * Once the promise resolves, everything is
   * ready to be used.
   *
   * If this fails, it will call `unload` to return to its
   * initial state.
   */
  load: async () => {
    console.count('BrowserWindows.load')
    if (BrowserWindows.state !== 'initial') return
    BrowserWindows.state = 'loading'
    try {
      const [all, current] = await Promise.all([
        getAllWindows(),
        getCurrentWindow(),
      ])
      BrowserWindows.all = all
      BrowserWindows.current = current
      BrowserWindows.byId = {}
      BrowserWindows.focused = undefined
      for (const browserWindow of all) {
        BrowserWindows.byId[browserWindow.id] = browserWindow
        if (browserWindow.focused) {
          BrowserWindows.focused = browserWindow
        }
      }
      registerChromeWindowEventHandlers()
      BrowserWindows.state = 'loaded'
    } catch (error) {
      console.error(error)
      BrowserWindows.unload()
    }
  },

  /**
   * Unloads the lib and unregisters its event handlers.
   *
   * In practice, this isn't expected to be used, but it can handle returning
   * things to their initial state if something goes wrong.
   */
  unload: () => {
    console.count('BrowserWindows.unload')
    unregisterChromeWindowEventHandlers()
    BrowserWindows.all = []
    BrowserWindows.byId = {}
    BrowserWindows.current = undefined
    BrowserWindows.focused = undefined
    BrowserWindows.state = 'initial'
  },

  /**
   * Creates a new browser window.
   */
  create: async (options?: chrome.windows.CreateData) => {
    console.count('BrowserWindows.create')
    const newChromeWindow = await chrome.windows.create(options || {})
    if (newChromeWindow.id) {
      // This is assumed to exist because onCreated is fired before
      // the create promise resolves.
      return BrowserWindows.byId[newChromeWindow.id]
    }
    return undefined
  },

  /**
   * Removes an existing browser window according to its ID.
   */
  removeById: async (id: BrowserWindowID) => {
    console.count('BrowserWindows.removeById')
    await chrome.windows.remove(id)
  },

  /**
   * Updates an existing browser window with the supplied info.
   * Resolves with the updated browser window.
   */
  updateById: async (id: BrowserWindowID, info: chrome.windows.UpdateInfo) => {
    console.count('BrowserWindows.updateById')
    await chrome.windows.update(id, info)
    // events will handle applying the updates to the object
    return BrowserWindows.byId[id]
  },

  /**
   * Fired whenever the list of browser window changes, such as by adding,
   * removing, or changing the order.
   */
  onListChanged: onBrowserWindowListChanged.listener,

  /**
   * Fired whenever the properties of a browser window are changed.
   */
  onUpdated: onBrowserWindowUpdated.listener,

  /**
   * Fired when a browser window becomes the "current" browser window.
   */
  onCurrentChanged: onCurrentBrowserWindowChanged.listener,

  /**
   * Fired when a browser window becomes the "focused" browser window.
   */
  onFocusedChanged: onFocusedBrowserWindowChanged.listener,
}
window.BrowserWindows = BrowserWindows

/**
 * Handles when the bounds or state of a chrome window are changed.
 *
 * If the user is dragging a window to resize it, this fires
 * at the end of the operation. There are no intermediary
 * updates.
 */
const onChromeWindowBoundsChanged = async (
  updatedChromeWindow: chrome.windows.Window,
) => {
  console.count('BrowserWindows.onBoundsChanged')
  if (!updatedChromeWindow.id) return
  const existingBrowserWindow = BrowserWindows.byId[updatedChromeWindow.id]
  Object.assign(existingBrowserWindow, updatedChromeWindow)
  onBrowserWindowUpdated.emit()
}

/**
 * Handles when a new chrome window is opened.
 */
const onChromeWindowCreated = async (
  newChromeWindow: chrome.windows.Window,
) => {
  console.count('BrowserWindows.onCreated')
  const newBrowserWindow = await toBrowserWindow(newChromeWindow)
  if (!newBrowserWindow) return
  BrowserWindows.all.push(newBrowserWindow)
  BrowserWindows.byId[newBrowserWindow.id] = newBrowserWindow
  onBrowserWindowListChanged.emit()
}

/**
 * Handles when focus changes to a different chrome window.
 */
const onChromeWindowFocusChanged = (newFocusedWindowId: BrowserWindowID) => {
  console.count('BrowserWindows.onFocusChanged')
  const newFocusedWindow = BrowserWindows.byId[newFocusedWindowId]
  const oldFocusedWindow = BrowserWindows.focused
  if (newFocusedWindow !== oldFocusedWindow) {
    if (oldFocusedWindow) oldFocusedWindow.focused = false
    if (newFocusedWindow) newFocusedWindow.focused = true
    BrowserWindows.focused = newFocusedWindow
    onBrowserWindowUpdated.emit()
    onFocusedBrowserWindowChanged.emit()
  }
}

/**
 * Handles when a chrome window is closed.
 */
const onChromeWindowRemoved = (removedWindowId: BrowserWindowID) => {
  console.count('BrowserWindows.onRemoved')
  const removedWindow = BrowserWindows.byId[removedWindowId]
  if (!removedWindow) return
  if (BrowserWindows.current === removedWindow) {
    BrowserWindows.current = undefined
    onCurrentBrowserWindowChanged.emit()
  }
  if (BrowserWindows.focused === removedWindow) {
    BrowserWindows.focused = undefined
    onFocusedBrowserWindowChanged.emit()
  }
  delete BrowserWindows.byId[removedWindowId]
  const removedWindowIndex = BrowserWindows.all.indexOf(removedWindow)
  if (removedWindowIndex >= 0) {
    BrowserWindows.all.splice(removedWindowIndex, 1)
  }
  onBrowserWindowListChanged.emit()
}

/**
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser windows.
 */
const registerChromeWindowEventHandlers = () => {
  chrome.windows.onBoundsChanged.addListener(onChromeWindowBoundsChanged)
  chrome.windows.onCreated.addListener(onChromeWindowCreated, {
    windowTypes: windowTypesToRegister,
  })
  chrome.windows.onFocusChanged.addListener(onFocusedBrowserWindowChanged, {
    windowTypes: windowTypesToRegister,
  })
  chrome.windows.onRemoved.addListener(onChromeWindowRemoved, {
    windowTypes: windowTypesToRegister,
  })
}

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
const unregisterChromeWindowEventHandlers = () => {
  chrome.windows.onBoundsChanged.removeListener(onChromeWindowBoundsChanged)
  chrome.windows.onCreated.removeListener(onChromeWindowCreated)
  chrome.windows.onFocusChanged.removeListener(onFocusedBrowserWindowChanged)
  chrome.windows.onRemoved.removeListener(onChromeWindowRemoved)
}
