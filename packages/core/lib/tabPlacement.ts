import { getMoveBlockReason } from './actions/batchTabActions.js'
import { getTabMoveUnits } from './commands.js'
import type { BrowserSnapshot, TabPlacement } from './browser.js'

/** Resolve insertion against the destination after removing the moving tabs. */
export const planTabPlacement = (
  snapshot: BrowserSnapshot,
  tabIds: readonly number[],
  destination: TabPlacement,
) => {
  const selected = new Set(tabIds)
  const tabs = snapshot.tabs
    .filter((tab) => selected.has(tab.id))
    .toSorted((a, b) => a.windowId - b.windowId || a.index - b.index)
  const remaining = snapshot.tabs
    .filter(
      (tab) => tab.windowId === destination.windowId && !selected.has(tab.id),
    )
    .toSorted((a, b) => a.index - b.index)
  const pinned = remaining.filter((tab) => tab.pinned).length
  const groupEnd = remaining.findLastIndex(
    (tab) => tab.groupId === destination.groupId,
  )
  const index =
    destination.beforeTabId !== undefined
      ? remaining.findIndex((tab) => tab.id === destination.beforeTabId)
      : destination.groupId !== undefined
        ? groupEnd + 1
        : tabs.every((tab) => tab.pinned)
          ? pinned
          : remaining.length
  return {
    tabs,
    remaining,
    index,
    beforeTabId: remaining[index]?.id,
    units: getTabMoveUnits(
      tabs.map((tab) => tab.id),
      snapshot,
    ),
  }
}

export const getTabPlacementReason = (
  snapshot: BrowserSnapshot,
  tabIds: readonly number[],
  destination: TabPlacement,
): string | undefined => {
  if (
    !tabIds.length ||
    tabIds.some((id) => !snapshot.tabs.some((tab) => tab.id === id))
  )
    return 'The moving tabs are no longer available.'
  const blocked = getMoveBlockReason(tabIds, snapshot, destination.windowId)
  if (blocked) return blocked
  const plan = planTabPlacement(snapshot, tabIds, destination)
  if (plan.index < 0) return 'The insertion position is no longer available.'
  const pinned = plan.tabs.filter((tab) => tab.pinned).length
  if (pinned && pinned !== plan.tabs.length)
    return 'Reorder pinned and unpinned tabs separately.'
  const pinnedCount = plan.remaining.filter((tab) => tab.pinned).length
  if (pinned ? plan.index > pinnedCount : plan.index < pinnedCount)
    return pinned
      ? 'Keep pinned tabs before other tabs.'
      : 'Place unpinned tabs after pinned tabs.'
  if (destination.groupId !== undefined) {
    const group = snapshot.groups.find(
      (group) => group.id === destination.groupId,
    )
    if (!group || group.windowId !== destination.windowId)
      return 'The destination group is no longer available.'
    if (pinned) return 'Pinned tabs cannot be placed inside a group.'
    if (
      plan.units.some(
        (unit) =>
          unit.groupId !== undefined && unit.groupId !== destination.groupId,
      )
    )
      return 'Place whole groups between other groups or tabs.'
    const before = plan.remaining[plan.index],
      previous = plan.remaining[plan.index - 1]
    if (
      before?.groupId !== group.id &&
      previous?.groupId !== group.id &&
      plan.remaining.some((tab) => tab.groupId === group.id)
    )
      return 'Choose a position inside the destination group.'
  } else {
    const before = plan.remaining[plan.index],
      previous = plan.remaining[plan.index - 1]
    if (before?.groupId !== undefined && previous?.groupId === before.groupId)
      return 'Choose whether to place tabs inside or outside the group.'
  }
  return undefined
}
