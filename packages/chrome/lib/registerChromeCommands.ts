import { TABBY_COMMANDS } from '@extension/shared/utils/commands'
import { browserWindowTypes } from './window/browserWindowTypes.js'
import {
  getWindowSwitchSlotEntries,
  getWindowSwitchSlotIndexFromCommand,
} from './window/windowSwitchSlots.js'

export const registerChromeCommands = (
  api: Pick<
    typeof chrome,
    'runtime' | 'commands' | 'windows' | 'action' | 'sidePanel'
  >,
) => {
  api.runtime.onInstalled.addListener(() => {
    // The action icon belongs to the search popup. The Tab Manager remains
    // available from the popup and its own shortcut.
    void api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch((error: unknown) => {
        console.warn('Could not configure the Tabby side panel', error)
      })
  })

  const getFocusedWindowId = async () => {
    const focusedWindow = await api.windows.getLastFocused({
      windowTypes: browserWindowTypes,
    })
    return focusedWindow.id !== undefined && focusedWindow.id >= 0
      ? focusedWindow.id
      : undefined
  }

  const focusWindowSlot = async (
    index: number,
    sourceIncognito?: boolean,
  ): Promise<void> => {
    const windowsPromise = api.windows.getAll({
      windowTypes: browserWindowTypes,
    })
    const focusedWindowPromise =
      sourceIncognito === undefined
        ? api.windows.getLastFocused({ windowTypes: browserWindowTypes })
        : Promise.resolve(undefined)
    const [windows, focusedWindow] = await Promise.all([
      windowsPromise,
      focusedWindowPromise,
    ])
    const incognito = sourceIncognito ?? focusedWindow?.incognito ?? false
    const eligibleWindows = windows.filter(
      (
        browserWindow,
      ): browserWindow is chrome.windows.Window & { id: number } =>
        typeof browserWindow.id === 'number',
    )
    const targetWindow = getWindowSwitchSlotEntries(eligibleWindows, incognito)[
      index
    ]?.window

    if (targetWindow) {
      await api.windows.update(targetWindow.id, { focused: true })
    }
  }

  const openOmnibar = async (sourceWindowId?: number) => {
    try {
      const windowId = sourceWindowId ?? (await getFocusedWindowId())
      if (windowId !== undefined) {
        await api.action.openPopup({ windowId })
      } else {
        await api.action.openPopup()
      }
    } catch (error) {
      console.warn('Could not open the Tabby search popup', error)
    }
  }

  api.commands.onCommand.addListener(async (command, tab) => {
    try {
      const windowSlotIndex = getWindowSwitchSlotIndexFromCommand(command)
      if (windowSlotIndex !== undefined) {
        await focusWindowSlot(windowSlotIndex, tab?.incognito)
      } else if (command === TABBY_COMMANDS.openOmnibar) {
        await openOmnibar(tab?.windowId)
      } else if (command === TABBY_COMMANDS.openTabManager) {
        const windowId = tab?.windowId ?? (await getFocusedWindowId())
        if (windowId === undefined) return

        await api.sidePanel.open({ windowId })
      }
    } catch (error) {
      console.warn(`Could not handle Tabby command "${command}"`, error)
    }
  })
}
