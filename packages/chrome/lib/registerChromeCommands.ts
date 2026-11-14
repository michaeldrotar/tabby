import { TABBY_COMMANDS } from '@extension/shared/utils/commands'
import { browserWindowTypes } from './window/browserWindowTypes.js'

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
      if (command === TABBY_COMMANDS.openOmnibar) {
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
