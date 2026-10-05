export const WINDOW_SWITCH_SLOT_COUNT = 10

export type WindowSwitchSlotEntry<T> = {
  window: T
  index: number
  number: number
}

export const getWindowSwitchSlotNumber = (
  index: number,
): number | undefined => {
  if (index < 0 || index >= WINDOW_SWITCH_SLOT_COUNT) return undefined
  return index + 1
}

export const getWindowSwitchSlotIndexFromKey = (
  key: string,
): number | undefined => {
  if (!/^\d$/.test(key)) return undefined
  return key === '0' ? 9 : Number(key) - 1
}

export const getWindowSwitchCommandName = (index: number): string => {
  const number = getWindowSwitchSlotNumber(index)
  if (number === undefined)
    throw new Error(`Invalid window switch slot: ${index}`)

  // Keep the existing command name for slot 10 so assigned Chrome shortcuts persist.
  const commandNumber = number === WINDOW_SWITCH_SLOT_COUNT ? 0 : number
  return `focus-window-${commandNumber}`
}

export const getWindowSwitchSlotIndexFromCommand = (
  command: string,
): number | undefined => {
  const match = /^focus-window-([0-9])$/.exec(command)
  if (!match?.[1]) return undefined
  return getWindowSwitchSlotIndexFromKey(match[1])
}

export const orderWindowsById = <T extends { id: number }>(windows: T[]): T[] =>
  [...windows].sort((a, b) => a.id - b.id)

export const getWindowSwitchSlotEntries = <
  T extends { id: number; incognito?: boolean },
>(
  windows: T[],
  incognito: boolean,
): WindowSwitchSlotEntry<T>[] =>
  orderWindowsById(
    windows.filter((window) => Boolean(window.incognito) === incognito),
  )
    .slice(0, WINDOW_SWITCH_SLOT_COUNT)
    .map((window, index) => ({
      window,
      index,
      number: getWindowSwitchSlotNumber(index)!,
    }))
