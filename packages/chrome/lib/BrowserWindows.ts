import { createEvent } from './createEvent.js';
import type { BrowserWindow } from './BrowserWindow.js';
import type { BrowserWindowID } from './BrowserWindowID.js';

const windowTypesToRegister: chrome.windows.windowTypeEnum[] = ['normal'];

const onUpdated = createEvent('updated');

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
    );
    return undefined;
  }
  return {
    id: chromeWindow.id,
    ...chromeWindow,
  };
};

/**
 * Gets all windows and converst them to BrowserWindow.
 */
const getAllWindows = async () => {
  const allChromeWindows = await chrome.windows.getAll();
  const allBrowserWindows = await Promise.all(
    allChromeWindows.map(toBrowserWindow),
  );
  return allBrowserWindows.filter(browserWindow => browserWindow !== undefined);
};

/**
 * Gets the current window and converts it to a BrowserWindow.
 */
const getCurrentWindow = async () => {
  const chromeWindow = await chrome.windows.getCurrent();
  const browserWindow = await toBrowserWindow(chromeWindow);
  return browserWindow;
};

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
    console.count('BrowserWindows.load');
    if (BrowserWindows.state !== 'initial') return;
    BrowserWindows.state = 'loading';
    try {
      const [all, current] = await Promise.all([
        getAllWindows(),
        getCurrentWindow(),
      ]);
      BrowserWindows.all = all;
      BrowserWindows.current = current;
      BrowserWindows.byId = {};
      BrowserWindows.focused = undefined;
      for (const browserWindow of all) {
        BrowserWindows.byId[browserWindow.id] = browserWindow;
        if (browserWindow.focused) {
          BrowserWindows.focused = browserWindow;
        }
      }
      registerEventHandlers();
      BrowserWindows.state = 'loaded';
    } catch (error) {
      console.error(error);
      BrowserWindows.unload();
    }
  },

  /**
   * Unloads the lib and unregisters its event handlers.
   *
   * In practice, this isn't expected to be used, but it can handle returning
   * things to their initial state if something goes wrong.
   */
  unload: () => {
    console.count('BrowserWindows.unload');
    unregisterEventHandlers();
    BrowserWindows.all = [];
    BrowserWindows.byId = {};
    BrowserWindows.current = undefined;
    BrowserWindows.focused = undefined;
    BrowserWindows.state = 'initial';
  },

  /**
   * Fired whenever the underlying browser window data is updated.
   * - a new browser window is opened and has been added to the list
   * - an existing browser window was closed and removed from the list
   * - the focused browser window has changed
   */
  onUpdated: onUpdated.listener,
};
window.BrowserWindows = BrowserWindows;

/**
 * Handles when a new chrome window is opened.
 */
const onCreated = async (newChromeWindow: chrome.windows.Window) => {
  console.count('BrowserWindows.onCreated');
  const newBrowserWindow = await toBrowserWindow(newChromeWindow);
  if (!newBrowserWindow) return;
  BrowserWindows.all.push(newBrowserWindow);
  BrowserWindows.byId[newBrowserWindow.id] = newBrowserWindow;
  onUpdated.emit();
};

/**
 * Handles when focus changes to a different chrome window.
 */
const onFocusChanged = (newFocusedWindowId: BrowserWindowID) => {
  console.count('BrowserWindows.onFocusChanged');
  const newFocusedWindow = BrowserWindows.byId[newFocusedWindowId];
  const oldFocusedWindow = BrowserWindows.focused;
  if (newFocusedWindow !== oldFocusedWindow) {
    if (oldFocusedWindow) oldFocusedWindow.focused = false;
    if (newFocusedWindow) newFocusedWindow.focused = true;
    BrowserWindows.focused = newFocusedWindow;
    onUpdated.emit();
  }
};

/**
 * Handles when a chrome window is closed.
 */
const onRemoved = (removedWindowId: BrowserWindowID) => {
  console.count('BrowserWindows.onRemoved');
  const removedWindow = BrowserWindows.byId[removedWindowId];
  if (!removedWindow) return;
  if (BrowserWindows.current === removedWindow) {
    BrowserWindows.current = undefined;
  }
  if (BrowserWindows.focused === removedWindow) {
    BrowserWindows.focused = undefined;
  }
  delete BrowserWindows.byId[removedWindowId];
  const removedWindowIndex = BrowserWindows.all.indexOf(removedWindow);
  if (removedWindowIndex >= 0) {
    BrowserWindows.all.splice(removedWindowIndex, 1);
  }
  onUpdated.emit();
};

/**
 * Registers all the necessary event handlers for tracking changes
 * to the list of browser windows.
 */
const registerEventHandlers = () => {
  chrome.windows.onCreated.addListener(onCreated, {
    windowTypes: windowTypesToRegister,
  });
  chrome.windows.onFocusChanged.addListener(onFocusChanged, {
    windowTypes: windowTypesToRegister,
  });
  chrome.windows.onRemoved.addListener(onRemoved, {
    windowTypes: windowTypesToRegister,
  });
};

/**
 * Handles unregistering all the event handlers to unload the lib
 * and restore its initial state.
 */
const unregisterEventHandlers = () => {
  chrome.windows.onCreated.removeListener(onCreated);
  chrome.windows.onFocusChanged.removeListener(onFocusChanged);
  chrome.windows.onRemoved.removeListener(onRemoved);
};
