import { TABBY_COMMANDS } from '@extension/shared/utils/commands'
import {
  getWindowSwitchCommandName,
  getWindowSwitchSlotNumber,
  WINDOW_SWITCH_SLOT_COUNT,
} from './window/windowSwitchSlots.js'
import { useQuery } from '@tanstack/react-query'
import type { TabbyCommand } from '@extension/shared/utils/commands'

export { TABBY_COMMANDS } from '@extension/shared/utils/commands'

export type CommandShortcuts = Record<TabbyCommand, string | undefined> & {
  windowSwitchSlots: Record<number, string | undefined>
}

const emptyWindowSwitchSlots = (): Record<number, string | undefined> => {
  const slots: Record<number, string | undefined> = {}
  for (let index = 0; index < WINDOW_SWITCH_SLOT_COUNT; index += 1) {
    const slotNumber = getWindowSwitchSlotNumber(index)
    if (slotNumber !== undefined) slots[slotNumber] = undefined
  }
  return slots
}

const emptyCommandShortcuts = (): CommandShortcuts => ({
  [TABBY_COMMANDS.openOmnibar]: undefined,
  [TABBY_COMMANDS.openTabManager]: undefined,
  windowSwitchSlots: emptyWindowSwitchSlots(),
})

/** Returns the shortcuts currently assigned to Tabby's Chrome commands. */
export const getCommandShortcuts = async (): Promise<CommandShortcuts> => {
  if (typeof chrome === 'undefined' || !chrome.commands) {
    return emptyCommandShortcuts()
  }

  try {
    const commands = await chrome.commands.getAll()
    const getShortcut = (name: string) =>
      commands.find((command) => command.name === name)?.shortcut || undefined
    const windowSwitchSlots = emptyWindowSwitchSlots()

    for (let index = 0; index < WINDOW_SWITCH_SLOT_COUNT; index += 1) {
      const slotNumber = getWindowSwitchSlotNumber(index)
      if (slotNumber !== undefined) {
        windowSwitchSlots[slotNumber] = getShortcut(
          getWindowSwitchCommandName(index),
        )
      }
    }

    return {
      [TABBY_COMMANDS.openOmnibar]: getShortcut(TABBY_COMMANDS.openOmnibar),
      [TABBY_COMMANDS.openTabManager]: getShortcut(
        TABBY_COMMANDS.openTabManager,
      ),
      windowSwitchSlots,
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
