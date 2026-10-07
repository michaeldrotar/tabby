import type {
  SelectionItemRef,
  SelectionSnapshot,
} from '../selection/SelectionModel'
import type { BrowserTabGroupColor } from '@extension/chrome/tabGroup/BrowserTabGroup'

export type BatchTabActionName =
  | 'pin'
  | 'unpin'
  | 'mute'
  | 'unmute'
  | 'reload'
  | 'duplicate'
  | 'ungroup'

export type BatchWindowAction = 'focus' | 'close'

export type BatchGroupAction =
  | { type: 'change-color'; color: BrowserTabGroupColor }
  | { type: 'rename'; title: string }
  | { type: 'set-collapse'; collapsed: boolean }

export type BatchTabRecord = {
  id: number
  windowId: number
  index: number
  groupId?: number
  pinned?: boolean
  active?: boolean
  discarded?: boolean
  audible?: boolean
  muted?: boolean
  title?: string
  url?: string
}

export type BatchWindowRecord = {
  id: number
  type?: string
  incognito?: boolean
}

export type BatchGroupRecord = {
  id: number
  windowId: number
}

export type BatchTabSnapshot = {
  tabs: readonly BatchTabRecord[]
  windows: readonly BatchWindowRecord[]
  groups: readonly BatchGroupRecord[]
}

export type BatchTabFailure = {
  tabId: number
  message: string
}

export type BatchTabActionResult = {
  requestedIds: number[]
  succeededIds: number[]
  failures: BatchTabFailure[]
  createdTargetId?: number
}

export type BatchTabActionPorts = {
  closeTab: (tabId: number) => Promise<void>
  moveTab: (tabId: number, targetWindowId: number) => Promise<void>
  moveFirstTabToNewWindow: (tabId: number) => Promise<number>
  addTabToGroup: (tabId: number, groupId: number) => Promise<void>
  createGroupWithTab: (tabId: number, targetWindowId: number) => Promise<number>
  performTabAction: (action: BatchTabActionName, tabId: number) => Promise<void>
  performWindowAction: (
    action: BatchWindowAction,
    windowId: number,
  ) => Promise<void>
  performGroupAction: (
    action: BatchGroupAction,
    groupId: number,
  ) => Promise<void>
  writeClipboardText: (text: string) => Promise<void>
}

/** Resolve explicit tabs plus tabs represented by selected groups/windows. */
export const resolveSelectedTabIds = (
  selection: SelectionSnapshot,
  snapshot: BatchTabSnapshot,
): number[] => {
  const selectedIds = new Set<number>()
  const selectedWindowIds = selection.windowIds
  const selectedGroupIds = selection.groupIds

  for (const tab of snapshot.tabs) {
    if (
      selection.tabIds.has(tab.id) ||
      (selectedWindowIds.has(tab.windowId) &&
        (selection.expandedWindowIds.has(tab.windowId) ||
          tab.active === true)) ||
      (tab.groupId !== undefined && selectedGroupIds.has(tab.groupId))
    ) {
      selectedIds.add(tab.id)
    }
  }

  const windowOrder = new Map(
    snapshot.windows.map((window, index) => [window.id, index]),
  )
  const tabById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
  return [...selectedIds].sort((leftId, rightId) => {
    const left = tabById.get(leftId)
    const right = tabById.get(rightId)
    if (!left || !right) return left ? -1 : right ? 1 : leftId - rightId
    const windowDifference =
      (windowOrder.get(left.windowId) ?? Number.MAX_SAFE_INTEGER) -
      (windowOrder.get(right.windowId) ?? Number.MAX_SAFE_INTEGER)
    return windowDifference || left.index - right.index || left.id - right.id
  })
}

export const runBatchTabAction = (
  tabIds: readonly number[],
  action: BatchTabActionName,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> =>
  runBatchIdsAction(tabIds, (tabId) => ports.performTabAction(action, tabId))

export const runBatchWindowAction = (
  windowIds: readonly number[],
  action: BatchWindowAction,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> =>
  runBatchIdsAction(windowIds, (windowId) =>
    ports.performWindowAction(action, windowId),
  )

export const runBatchGroupAction = (
  groupIds: readonly number[],
  action: BatchGroupAction,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> =>
  runBatchIdsAction(groupIds, (groupId) =>
    ports.performGroupAction(action, groupId),
  )

export const runBatchClipboardAction = async (
  tabIds: readonly number[],
  text: string,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> => {
  const result = createResult(tabIds)
  if (tabIds.length === 0) return result
  try {
    await ports.writeClipboardText(text)
    result.succeededIds.push(...tabIds)
  } catch (error) {
    const message = getErrorMessage(error)
    result.failures.push(...tabIds.map((tabId) => ({ tabId, message })))
  }
  return result
}

export const formatBatchTabCopyText = (
  tabs: readonly BatchTabRecord[],
  kind: 'urls' | 'titles' | 'titles-and-urls',
): string => {
  const values = tabs.flatMap((tab) => {
    const title = tab.title?.trim()
    const url = tab.url?.trim()
    if (kind === 'urls') return url ? [url] : []
    if (kind === 'titles') return title ? [title] : []
    if (!title && !url) return []
    return [`${title ?? ''}\t${url ?? ''}`.trim()]
  })
  return values.join('\n')
}

const runBatchIdsAction = async (
  ids: readonly number[],
  perform: (id: number) => Promise<void>,
): Promise<BatchTabActionResult> => {
  const result = createResult(ids)
  for (const id of ids) {
    try {
      await perform(id)
      result.succeededIds.push(id)
    } catch (error) {
      result.failures.push({ tabId: id, message: getErrorMessage(error) })
    }
  }
  return result
}

/** Resolve the tabs represented by one focused window, group, or tab row. */
export const resolveSelectionItemTabIds = (
  item: SelectionItemRef,
  snapshot: BatchTabSnapshot,
): number[] =>
  resolveSelectedTabIds(
    {
      windowIds: item.type === 'window' ? new Set([item.id]) : new Set(),
      expandedWindowIds: new Set(),
      groupIds: item.type === 'group' ? new Set([item.id]) : new Set(),
      tabIds: item.type === 'tab' ? new Set([item.id]) : new Set(),
    },
    snapshot,
  )

/** Whether a focused row is explicitly selected or represented by a parent. */
export const isSelectionItemRepresented = (
  item: SelectionItemRef,
  selection: SelectionSnapshot,
  snapshot: BatchTabSnapshot,
): boolean => {
  if (item.type === 'window') return selection.windowIds.has(item.id)
  if (item.type === 'group') {
    const windowId = snapshot.groups.find(
      (group) => group.id === item.id,
    )?.windowId
    return (
      selection.groupIds.has(item.id) ||
      (windowId !== undefined && selection.windowIds.has(windowId))
    )
  }
  return resolveSelectedTabIds(selection, snapshot).includes(item.id)
}

export const getMoveBlockReason = (
  tabIds: readonly number[],
  snapshot: BatchTabSnapshot,
  targetWindowId: number,
): string | undefined => {
  if (tabIds.length === 0) return 'No tabs are selected.'

  const target = snapshot.windows.find((window) => window.id === targetWindowId)
  if (!target) return 'The destination window is no longer available.'
  if (target.type !== undefined && target.type !== 'normal') {
    return 'Tabs can only be moved to a normal window.'
  }

  const tabsById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
  const selectedTabs = tabIds.map((id) => tabsById.get(id))
  if (selectedTabs.some((tab) => tab === undefined)) {
    return 'One or more selected tabs are no longer available.'
  }

  const sourceWindows = new Map(
    snapshot.windows.map((window) => [window.id, window]),
  )
  if (selectedTabs.some((tab) => !sourceWindows.has(tab!.windowId))) {
    return 'One or more source windows are no longer available.'
  }
  if (
    selectedTabs.some((tab) => {
      const source = sourceWindows.get(tab!.windowId)
      return source?.type !== undefined && source.type !== 'normal'
    })
  ) {
    return 'Tabs can only be moved from a normal window.'
  }

  if (
    selectedTabs.some(
      (tab) => sourceWindows.get(tab!.windowId)?.incognito !== target.incognito,
    )
  ) {
    return 'Tabs cannot be moved between regular and incognito windows.'
  }
  return undefined
}

export const getGroupActionBlockReason = (
  tabIds: readonly number[],
  snapshot: BatchTabSnapshot,
): string | undefined => {
  if (tabIds.length === 0) return 'No tabs are selected.'
  const tabById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
  const selectedTabs = tabIds.map((id) => tabById.get(id))
  if (selectedTabs.some((tab) => tab === undefined)) {
    return 'One or more selected tabs are no longer available.'
  }
  const windowIds = new Set(selectedTabs.map((tab) => tab!.windowId))
  if (windowIds.size > 1) return 'Selected tabs must be in the same window.'
  const windowId = selectedTabs[0]?.windowId
  const sourceWindow = snapshot.windows.find((window) => window.id === windowId)
  if (!sourceWindow) return 'The source window is no longer available.'
  if (sourceWindow.type !== 'normal') {
    return 'Tab groups require a normal window.'
  }
  return undefined
}

export const getNewWindowMoveBlockReason = (
  tabIds: readonly number[],
  snapshot: BatchTabSnapshot,
): string | undefined => {
  if (tabIds.length === 0) return 'No tabs are selected.'
  const tabById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
  const selectedTabs = tabIds.map((id) => tabById.get(id))
  if (selectedTabs.some((tab) => tab === undefined)) {
    return 'One or more selected tabs are no longer available.'
  }

  const windowsById = new Map(
    snapshot.windows.map((window) => [window.id, window]),
  )
  const sourceWindows = selectedTabs.map((tab) =>
    windowsById.get(tab!.windowId),
  )
  if (sourceWindows.some((window) => !window)) {
    return 'One or more source windows are no longer available.'
  }
  if (sourceWindows.some((window) => window!.type !== 'normal')) {
    return 'Tabs can only be moved from a normal window.'
  }
  if (new Set(sourceWindows.map((window) => window!.incognito)).size > 1) {
    return 'Regular and incognito tabs cannot share a new window.'
  }
  return undefined
}

export const getSingleGroupRenameState = (
  selection: SelectionSnapshot,
): { visible: boolean; enabled: boolean; reason?: string } => {
  if (selection.groupIds.size === 0) {
    return { visible: false, enabled: false }
  }
  if (
    selection.groupIds.size !== 1 ||
    selection.tabIds.size > 0 ||
    selection.windowIds.size > 0
  ) {
    return {
      visible: true,
      enabled: false,
      reason: 'Select exactly one tab group to rename it.',
    }
  }
  return { visible: true, enabled: true }
}

export const runBatchClose = async (
  tabIds: readonly number[],
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> => {
  const result = createResult(tabIds)
  const settled = await Promise.allSettled(
    tabIds.map((tabId) => ports.closeTab(tabId)),
  )
  settled.forEach((outcome, index) => {
    const tabId = tabIds[index]
    if (tabId === undefined) return
    if (outcome.status === 'fulfilled') result.succeededIds.push(tabId)
    else
      result.failures.push({ tabId, message: getErrorMessage(outcome.reason) })
  })
  return result
}

/** Move tabs sequentially so successful tabs retain source order at the target. */
export const runBatchMoveToWindow = async (
  tabIds: readonly number[],
  targetWindowId: number,
  sourceWindowByTabId: ReadonlyMap<number, number>,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> => {
  const result = createResult(tabIds)
  for (const tabId of tabIds) {
    if (sourceWindowByTabId.get(tabId) === targetWindowId) {
      result.succeededIds.push(tabId)
      continue
    }
    try {
      await ports.moveTab(tabId, targetWindowId)
      result.succeededIds.push(tabId)
    } catch (error) {
      result.failures.push({ tabId, message: getErrorMessage(error) })
    }
  }
  return result
}

/** Create a single destination window from the first tab, then append in order. */
export const runBatchMoveToNewWindow = async (
  tabIds: readonly number[],
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> => {
  const result = createResult(tabIds)
  const [firstTabId, ...remainingTabIds] = tabIds
  if (firstTabId === undefined) return result

  try {
    result.createdTargetId = await ports.moveFirstTabToNewWindow(firstTabId)
    result.succeededIds.push(firstTabId)
  } catch (error) {
    result.failures.push(
      ...tabIds.map((tabId) => ({ tabId, message: getErrorMessage(error) })),
    )
    return result
  }

  for (const tabId of remainingTabIds) {
    try {
      await ports.moveTab(tabId, result.createdTargetId)
      result.succeededIds.push(tabId)
    } catch (error) {
      result.failures.push({ tabId, message: getErrorMessage(error) })
    }
  }
  return result
}

export const runBatchAddToGroup = async (
  tabIds: readonly number[],
  groupId: number,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> => {
  const result = createResult(tabIds)
  for (const tabId of tabIds) {
    try {
      await ports.addTabToGroup(tabId, groupId)
      result.succeededIds.push(tabId)
    } catch (error) {
      result.failures.push({ tabId, message: getErrorMessage(error) })
    }
  }
  return result
}

export const runBatchCreateGroup = async (
  tabIds: readonly number[],
  targetWindowId: number,
  ports: BatchTabActionPorts,
): Promise<BatchTabActionResult> => {
  const result = createResult(tabIds)
  const [firstTabId, ...remainingTabIds] = tabIds
  if (firstTabId === undefined) return result

  try {
    result.createdTargetId = await ports.createGroupWithTab(
      firstTabId,
      targetWindowId,
    )
    result.succeededIds.push(firstTabId)
  } catch (error) {
    result.failures.push(
      ...tabIds.map((tabId) => ({ tabId, message: getErrorMessage(error) })),
    )
    return result
  }

  for (const tabId of remainingTabIds) {
    try {
      await ports.addTabToGroup(tabId, result.createdTargetId)
      result.succeededIds.push(tabId)
    } catch (error) {
      result.failures.push({ tabId, message: getErrorMessage(error) })
    }
  }
  return result
}

const createResult = (tabIds: readonly number[]): BatchTabActionResult => ({
  requestedIds: [...tabIds],
  succeededIds: [],
  failures: [],
})

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
