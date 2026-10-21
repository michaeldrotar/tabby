import {
  getGroupActionBlockReason,
  getMoveBlockReason,
  getNewWindowMoveBlockReason,
} from './actions/batchTabActions.js'
import { isNavigableUrl } from './navigation.js'
import { getSplitViewBlockReason } from './splitViews.js'
import { getTabPlacementReason } from './tabPlacement.js'
import type {
  BrowserCommand,
  BrowserSnapshot,
  BrowserTab,
  CommandOutcome,
} from './browser.js'

/** Keep transfer focus and selection in the source tab order. */
export const getMovedTabIds = (
  command: BrowserCommand,
  snapshot: BrowserSnapshot,
  outcome: CommandOutcome,
): number[] => {
  if (!['move-tabs', 'move-group', 'place-tabs'].includes(command.type))
    return []
  return snapshot.tabs
    .filter((tab) =>
      command.type === 'move-group'
        ? tab.groupId === command.groupId &&
          outcome.succeededIds.includes(command.groupId)
        : outcome.succeededIds.includes(tab.id),
    )
    .toSorted((a, b) => a.windowId - b.windowId || a.index - b.index)
    .map((tab) => tab.id)
}

const getTabIdsByUrl = (tabs: readonly BrowserTab[]) => {
  const tabIdsByUrl = new Map<string, number[]>()
  for (const tab of tabs) {
    if (!tab.url) continue
    const ids = tabIdsByUrl.get(tab.url) ?? []
    ids.push(tab.id)
    tabIdsByUrl.set(tab.url, ids)
  }
  return tabIdsByUrl
}

export const getDuplicateTabIds = (tabs: readonly BrowserTab[]): number[] =>
  [...getTabIdsByUrl(tabs).values()].filter((ids) => ids.length > 1).flat()

export const getOtherTabIdsWithSameUrl = (
  tabs: readonly BrowserTab[],
  tabId: number,
): number[] => {
  const target = tabs.find((tab) => tab.id === tabId)
  if (!target?.url) return []
  return (getTabIdsByUrl(tabs).get(target.url) ?? []).filter(
    (id) => id !== target.id,
  )
}

/** Move complete native groups as units; partial selections remain individual tabs. */
export const getTabMoveUnits = (
  tabIds: readonly number[],
  snapshot: BrowserSnapshot,
) => {
  const selected = new Set(tabIds)
  const complete = new Map(
    snapshot.groups.flatMap((group) => {
      const members = snapshot.tabs.filter((tab) => tab.groupId === group.id)
      return members.length && members.every((tab) => selected.has(tab.id))
        ? [[group.id, members.map((tab) => tab.id)] as const]
        : []
    }),
  )
  const seen = new Set<number>()
  return tabIds.flatMap<{ groupId: number | undefined; tabIds: number[] }>(
    (id) => {
      const groupId = snapshot.tabs.find((tab) => tab.id === id)?.groupId
      if (groupId !== undefined && complete.has(groupId)) {
        if (seen.has(groupId)) return []
        seen.add(groupId)
        return [{ groupId, tabIds: [...complete.get(groupId)!] }]
      }
      return [{ groupId: undefined, tabIds: [id] }]
    },
  )
}

export const getCommandTargetIds = (
  command: BrowserCommand,
  snapshot?: BrowserSnapshot,
): number[] => {
  switch (command.type) {
    case 'close-tabs':
    case 'tab-action':
    case 'move-tabs':
    case 'place-tabs':
    case 'group-tabs':
    case 'create-split':
      return [...new Set(command.tabIds)]
    case 'separate-split':
      return (
        snapshot?.tabs
          .filter((tab) => tab.splitViewId === command.splitViewId)
          .map((tab) => tab.id) ?? []
      )
    case 'window-action':
      return [...new Set(command.windowIds)]
    case 'group-action':
      return [...new Set(command.groupIds)]
    case 'close-relative-tabs': {
      const target = snapshot?.tabs.find((tab) => tab.id === command.tabId)
      if (!target || !snapshot) return [command.tabId]
      if (command.direction === 'duplicates')
        return getOtherTabIdsWithSameUrl(snapshot.tabs, target.id)
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
    case 'name-window':
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
  if (
    'url' in command &&
    command.url !== undefined &&
    !isNavigableUrl(command.url)
  )
    return 'This URL cannot be opened. Use a web address or a supported browser page.'
  const ids = getCommandTargetIds(command, snapshot)
  if (command.type === 'create-split')
    return getSplitViewBlockReason(snapshot, command.tabIds)
  if (command.type === 'separate-split') {
    if (!snapshot.splitViewSupported)
      return 'Split view controls are unavailable in this browser.'
    if (ids.length !== 2) return 'The split view is no longer available.'
  }
  if (command.type === 'place-tabs')
    return getTabPlacementReason(snapshot, command.tabIds, command.destination)
  if (command.type === 'create-tab') {
    const anchorId = command.afterTabId ?? command.splitWithTabId
    if (anchorId !== undefined) {
      const anchor = snapshot.tabs.find((tab) => tab.id === anchorId)
      if (!anchor) return 'The source tab is no longer available.'
      if (
        command.windowId !== undefined &&
        command.windowId !== anchor.windowId
      )
        return 'The new tab must be in the source tab’s window.'
      if (command.groupId !== undefined && command.groupId !== anchor.groupId)
        return 'The new tab must be in the source tab’s group.'
      if (command.splitWithTabId !== undefined) {
        if (!snapshot.splitViewSupported)
          return 'Split view controls are unavailable in this browser.'
        if (anchor.splitViewId !== undefined)
          return 'The source tab is already in a split view.'
      }
    }
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

export const planTabCreation = (
  snapshot: BrowserSnapshot,
  command: Extract<BrowserCommand, { type: 'create-tab' }>,
) => {
  const anchor = snapshot.tabs.find(
    (tab) => tab.id === (command.afterTabId ?? command.splitWithTabId),
  )
  const groupId = anchor?.groupId ?? command.groupId
  const group = snapshot.groups.find((group) => group.id === groupId)
  const windowId = anchor?.windowId ?? command.windowId ?? group?.windowId
  const tabs = snapshot.tabs.filter((tab) => tab.windowId === windowId)
  const split = command.splitWithTabId !== undefined
  const last = anchor
    ? Math.max(
        anchor.index,
        ...tabs
          .filter(
            (tab) =>
              anchor.splitViewId !== undefined &&
              tab.splitViewId === anchor.splitViewId,
          )
          .map((tab) => tab.index),
      )
    : groupId !== undefined
      ? Math.max(
          -1,
          ...tabs
            .filter((tab) => tab.groupId === groupId)
            .map((tab) => tab.index),
        )
      : undefined
  return {
    windowId,
    groupId,
    pinned: split && Boolean(anchor?.pinned),
    index:
      last === undefined
        ? undefined
        : Math.max(
            last + 1,
            split ? 0 : tabs.filter((tab) => tab.pinned).length,
          ),
    openerTabId:
      anchor?.id ??
      (groupId !== undefined
        ? tabs.find((tab) => tab.index === last)?.id
        : undefined),
  }
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
  } else if (adjacent?.groupId !== undefined && !tab.pinned)
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
