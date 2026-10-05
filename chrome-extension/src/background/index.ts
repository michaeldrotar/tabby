import 'webextension-polyfill'
import { browserWindowTypes } from '@extension/chrome/window/browserWindowTypes'
import {
  getWindowSwitchSlotEntries,
  getWindowSwitchSlotIndexFromCommand,
} from '@extension/chrome/window/windowSwitchSlots'
import { TABBY_COMMANDS } from '@extension/shared/utils/commands'

let focusedWindowId: number | undefined = undefined
const loadFocusedWindowId = async () => {
  const focusedWindow = await chrome.windows.getLastFocused()
  focusedWindowId = focusedWindow.id
}
void loadFocusedWindowId().catch((error) => {
  console.debug('Could not determine the focused browser window', { error })
})

chrome.runtime.onInstalled.addListener(() => {
  // The action icon belongs to the search popup. The Tab Manager remains
  // available from the popup and its own shortcut.
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
})

chrome.windows.onFocusChanged.addListener((id) => {
  focusedWindowId = id
})

const getFocusedWindowId = async () => {
  if (focusedWindowId !== undefined && focusedWindowId >= 0) {
    return focusedWindowId
  }

  const focusedWindow = await chrome.windows.getLastFocused()
  return focusedWindow.id !== undefined && focusedWindow.id >= 0
    ? focusedWindow.id
    : undefined
}

const focusWindowSlot = async (
  index: number,
  sourceIncognito?: boolean,
): Promise<void> => {
  const windowsPromise = chrome.windows.getAll({
    windowTypes: browserWindowTypes,
  })
  const focusedWindowPromise =
    sourceIncognito === undefined
      ? chrome.windows.getLastFocused({ windowTypes: browserWindowTypes })
      : Promise.resolve(undefined)
  const [windows, focusedWindow] = await Promise.all([
    windowsPromise,
    focusedWindowPromise,
  ])
  const incognito = sourceIncognito ?? focusedWindow?.incognito ?? false
  const eligibleWindows = windows.filter(
    (browserWindow): browserWindow is chrome.windows.Window & { id: number } =>
      typeof browserWindow.id === 'number',
  )
  const targetWindow = getWindowSwitchSlotEntries(eligibleWindows, incognito)[
    index
  ]?.window

  if (targetWindow) {
    await chrome.windows.update(targetWindow.id, { focused: true })
  }
}

const openOmnibar = async () => {
  try {
    const windowId = await getFocusedWindowId()
    if (windowId !== undefined) {
      await chrome.action.openPopup({ windowId })
    } else {
      await chrome.action.openPopup()
    }
  } catch (error) {
    console.warn('Could not open the Tabby search popup', error)
  }
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  try {
    const windowSlotIndex = getWindowSwitchSlotIndexFromCommand(command)
    if (windowSlotIndex !== undefined) {
      await focusWindowSlot(windowSlotIndex, tab?.incognito)
    } else if (command === TABBY_COMMANDS.openOmnibar) {
      await openOmnibar()
    } else if (command === TABBY_COMMANDS.openTabManager) {
      const windowId = await getFocusedWindowId()
      if (windowId === undefined) return

      // We can't easily check if it's open, but calling open will open it.
      // To toggle, we might need to rely on the user closing it manually or use a hack.
      // Chrome API doesn't have a simple 'toggle' or 'isOpen' check for sidePanel yet.
      // For now, let's just ensure it opens.
      await chrome.sidePanel.open({ windowId })
    }
  } catch (error) {
    console.warn(`Could not handle Tabby command "${command}"`, error)
  }
})
