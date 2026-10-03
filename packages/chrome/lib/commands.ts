import { TABBY_COMMANDS } from '@extension/shared/utils/commands'
import { useQuery } from '@tanstack/react-query'
import type { TabbyCommand } from '@extension/shared/utils/commands'

export { TABBY_COMMANDS } from '@extension/shared/utils/commands'

export type CommandShortcuts = Record<TabbyCommand, string | undefined>

const emptyCommandShortcuts = (): CommandShortcuts => ({
  [TABBY_COMMANDS.openOmnibar]: undefined,
  [TABBY_COMMANDS.openTabManager]: undefined,
})

/** Returns the shortcuts currently assigned to Tabby's Chrome commands. */
export const getCommandShortcuts = async (): Promise<CommandShortcuts> => {
  if (typeof chrome === 'undefined' || !chrome.commands) {
    return emptyCommandShortcuts()
  }

  try {
    const commands = await chrome.commands.getAll()
    const getShortcut = (name: TabbyCommand) =>
      commands.find((command) => command.name === name)?.shortcut || undefined

    return {
      [TABBY_COMMANDS.openOmnibar]: getShortcut(TABBY_COMMANDS.openOmnibar),
      [TABBY_COMMANDS.openTabManager]: getShortcut(
        TABBY_COMMANDS.openTabManager,
      ),
    }
  } catch (error) {
    console.debug('Could not load Tabby keyboard shortcuts', { error })
    return emptyCommandShortcuts()
  }
}

export const useCommandShortcuts = () => {
  return useQuery<CommandShortcuts, Error>({
    queryKey: ['chrome.commands.getAll'],
    queryFn: getCommandShortcuts,
  })
}
