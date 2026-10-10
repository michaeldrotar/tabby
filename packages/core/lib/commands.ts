import {
  getGroupActionBlockReason,
  getMoveBlockReason,
  getNewWindowMoveBlockReason,
} from './actions/batchTabActions.js'
import type {
  BrowserCommand,
  BrowserSnapshot,
  BrowserTab,
  CommandOutcome,
} from './browser.js'

export const getCommandTargetIds = (
  command: BrowserCommand,
  snapshot?: BrowserSnapshot,
): number[] => {
  switch (command.type) {
    case 'close-tabs':
    case 'tab-action':
    case 'move-tabs':
    case 'group-tabs':
      return [...new Set(command.tabIds)]
    case 'window-action':
      return [...new Set(command.windowIds)]
    case 'group-action':
      return [...new Set(command.groupIds)]
    case 'close-relative-tabs': {
      const target = snapshot?.tabs.find((tab) => tab.id === command.tabId)
      if (!target || !snapshot) return [command.tabId]
      return snapshot.tabs
        .filter(
          (tab) =>
            tab.windowId === target.windowId &&
            tab.id !== target.id &&
            !tab.pinned &&
            (command.direction === 'other' || tab.index > target.index),
        )
        .sort((a, b) => a.index - b.index)
        .map((tab) => tab.id)
    }
    case 'navigate-tab':
    case 'activate-tab':
    case 'move-tab':
      return [command.tabId]
    case 'close-window':
    case 'activate-window':
      return [command.windowId]
    case 'move-group':
    case 'set-group-collapsed':
      return [command.groupId]
    case 'create-tab':
    case 'create-window':
      return []
  }
}

export const getCommandBlockReason = (
  command: BrowserCommand,
  snapshot: BrowserSnapshot,
): string | undefined => {
  const ids = getCommandTargetIds(command, snapshot)
  if (command.type === 'create-tab') {
    if (
      command.windowId !== undefined &&
      !snapshot.windows.some((window) => window.id === command.windowId)
    )
      return 'The destination window is no longer available.'
    if (command.groupId !== undefined) {
      const group = snapshot.groups.find(
        (group) => group.id === command.groupId,
      )
      if (!group) return 'The destination group is no longer available.'
      if (command.windowId !== undefined && group.windowId !== command.windowId)
        return 'Tabs must be in the same window as the destination group.'
    }
  }
  if (command.type === 'move-group') {
    const tabs = snapshot.tabs
      .filter((tab) => tab.groupId === command.groupId)
      .map((tab) => tab.id)
    return command.windowId === undefined
      ? getNewWindowMoveBlockReason(tabs, snapshot)
      : getMoveBlockReason(tabs, snapshot, command.windowId)
  }
  if (command.type === 'move-tabs')
    return command.windowId === undefined
      ? getNewWindowMoveBlockReason(ids, snapshot)
      : getMoveBlockReason(ids, snapshot, command.windowId)
  if (command.type === 'group-tabs') {
    const reason = getGroupActionBlockReason(ids, snapshot)
    if (reason) return reason
    if (command.groupId !== undefined) {
      const group = snapshot.groups.find(
        (group) => group.id === command.groupId,
      )
      if (!group) return 'The destination group is no longer available.'
      if (
        snapshot.tabs.some(
          (tab) => ids.includes(tab.id) && tab.windowId !== group.windowId,
        )
      )
        return 'Tabs must be in the same window as the destination group.'
    }
  }
  return undefined
}

export type TabMovePlan =
  | { type: 'move'; index: number }
  | { type: 'group'; groupId: number }
  | { type: 'ungroup' }
  | { type: 'none' }
export const planTabMove = (
  snapshot: BrowserSnapshot,
  tabId: number,
  direction: 'backward' | 'forward',
): TabMovePlan => {
  const tab = snapshot.tabs.find((tab) => tab.id === tabId)
  if (!tab) throw new Error('The tab is no longer available.')
  const tabs = snapshot.tabs
    .filter((candidate) => candidate.windowId === tab.windowId)
    .sort((a, b) => a.index - b.index)
  const step = direction === 'backward' ? -1 : 1
  const adjacent = tabs.find(
    (candidate) => candidate.index === tab.index + step,
  )
  if (tab.groupId !== undefined) {
    if (adjacent?.groupId !== tab.groupId) return { type: 'ungroup' }
  } else if (adjacent?.groupId !== undefined)
    return { type: 'group', groupId: adjacent.groupId }
  return adjacent && adjacent.pinned === tab.pinned
    ? { type: 'move', index: adjacent.index }
    : { type: 'none' }
}

export const planGroupMove = (
  snapshot: BrowserSnapshot,
  groupId: number,
  direction: 'backward' | 'forward',
): number | undefined => {
  const groupTabs = snapshot.tabs
    .filter((tab) => tab.groupId === groupId)
    .sort((a, b) => a.index - b.index)
  const first = groupTabs[0],
    last = groupTabs.at(-1)
  if (!first || !last) throw new Error('The tab group is no longer available.')
  const tabs = snapshot.tabs.filter((tab) => tab.windowId === first.windowId)
  const neighbor = tabs.find(
    (tab) =>
      tab.index ===
      (direction === 'backward' ? first.index - 1 : last.index + 1),
  )
  if (!neighbor || neighbor.pinned) return undefined
  if (neighbor.groupId === undefined)
    return first.index + (direction === 'backward' ? -1 : 1)
  const adjacent = tabs.filter((tab) => tab.groupId === neighbor.groupId)
  return direction === 'backward'
    ? Math.min(...adjacent.map((tab) => tab.index))
    : first.index + Math.max(...adjacent.map((tab) => tab.index)) - last.index
}

export const createCommandOutcome = (
  requestedIds: readonly number[],
  succeededIds: readonly number[],
  failures: CommandOutcome['failures'],
  additions: Partial<CommandOutcome> = {},
): CommandOutcome => ({
  status: failures.length
    ? succeededIds.length
      ? 'partial'
      : 'failed'
    : 'success',
  requestedIds,
  succeededIds,
  failures,
  ...additions,
})

/** Keep a group contiguous when inserting a member, and preserve source order. */
export const insertTabs = (
  tabs: readonly BrowserTab[],
  inserted: readonly BrowserTab[],
  windowId: number,
  index: number,
): BrowserTab[] => {
  const insertedIds = new Set(inserted.map((tab) => tab.id))
  const remaining = tabs.filter((tab) => !insertedIds.has(tab.id))
  const windowTabs = remaining
    .filter((tab) => tab.windowId === windowId)
    .sort((a, b) => a.index - b.index)
  const position =
    index < 0
      ? windowTabs.length
      : Math.max(0, Math.min(index, windowTabs.length))
  windowTabs.splice(
    position,
    0,
    ...inserted.map((tab) => ({ ...tab, windowId })),
  )
  return [
    ...remaining.filter((tab) => tab.windowId !== windowId),
    ...windowTabs.map((tab, index) => ({ ...tab, index })),
  ]
}
