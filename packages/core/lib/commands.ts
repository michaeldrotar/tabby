import type { BrowserCommand } from './browser.js'

export const getCommandTargetIds = (command: BrowserCommand): number[] => {
  switch (command.type) {
    case 'close-tabs':
      return [...new Set(command.tabIds)]
    case 'activate-tab':
      return [command.tabId]
    case 'close-window':
    case 'activate-window':
      return [command.windowId]
    case 'set-group-collapsed':
      return [command.groupId]
    case 'create-window':
      return []
  }
}
