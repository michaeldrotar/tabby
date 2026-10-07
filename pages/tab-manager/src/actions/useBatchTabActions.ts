import { useBrowserTabs } from '@extension/chrome/tab/useBrowserTabs'
import { useBrowserTabGroups } from '@extension/chrome/tabGroup/useBrowserTabGroups'
import { useBrowserStore } from '@extension/chrome/useBrowserStore'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useSelectedWindowId } from '@extension/chrome/window/useSelectedWindowId'
import { useSetSelectedWindowId } from '@extension/chrome/window/useSetSelectedWindowId'
import { t } from '@extension/i18n/i18n'
import { tt } from '@extension/i18n/plurals'
import { toast } from '@extension/ui/components/Toaster'
import { useCallback, useMemo } from 'react'
import { useSelectionStore } from '../selection/SelectionStore'
import {
  formatBatchTabCopyText,
  getGroupActionBlockReason,
  getMoveBlockReason,
  getNewWindowMoveBlockReason,
  isSelectionItemRepresented,
  resolveSelectedTabIds,
  runBatchAddToGroup,
  runBatchClipboardAction,
  runBatchClose,
  runBatchCreateGroup,
  runBatchDiscardAction,
  runBatchGroupAction,
  runBatchMoveToNewWindow,
  runBatchMoveToWindow,
  runBatchTabAction,
  runBatchWindowAction,
} from './batchTabActions'
import { chromeBatchTabActionPorts } from './chromeBatchTabActionPorts'
import type { SelectionItemRef } from '../selection/SelectionModel'
import type {
  BatchDiscardActionResult,
  BatchGroupAction,
  BatchTabActionName,
  BatchTabActionResult,
  BatchTabSnapshot,
  BatchWindowAction,
} from './batchTabActions'

type BatchOperation = 'closed' | 'moved' | 'grouped'

const successMessageKeys = {
  closed: 'toast_nTabsClosed',
  moved: 'toast_nTabsMoved',
  grouped: 'toast_nTabsGrouped',
} as const

const operationLabels: Record<BatchOperation, string> = {
  closed: 'closed',
  moved: 'moved',
  grouped: 'grouped',
}

export const useBatchTabActions = () => {
  const tabs = useBrowserTabs()
  const windows = useBrowserWindows()
  const groups = useBrowserTabGroups()
  const windowIds = useSelectionStore((state) => state.windowIds)
  const expandedWindowIds = useSelectionStore(
    (state) => state.expandedWindowIds,
  )
  const groupIds = useSelectionStore((state) => state.groupIds)
  const tabIds = useSelectionStore((state) => state.tabIds)
  const setSelectedWindowId = useSetSelectedWindowId()
  const selectedWindowId = useSelectedWindowId()

  const selection = useMemo(
    () => ({ windowIds, expandedWindowIds, groupIds, tabIds }),
    [windowIds, expandedWindowIds, groupIds, tabIds],
  )
  const snapshot = useMemo<BatchTabSnapshot>(
    () => ({
      tabs: tabs.map((tab) => ({
        id: tab.id,
        windowId: tab.windowId,
        index: tab.index,
        groupId: tab.groupId,
        pinned: tab.pinned,
        active: tab.active,
        discarded: tab.discarded,
        audible: tab.audible,
        muted: tab.mutedInfo?.muted,
        title: tab.title,
        url: tab.url,
      })),
      windows: windows.map((window) => ({
        id: window.id,
        type: window.type,
        incognito: window.incognito,
      })),
      groups: groups.map((group) => ({
        id: group.id,
        windowId: group.windowId,
      })),
    }),
    [groups, tabs, windows],
  )
  const selectedTabIds = useMemo(
    () => resolveSelectedTabIds(selection, snapshot),
    [selection, snapshot],
  )

  const getCurrentSnapshot = useCallback((): BatchTabSnapshot => {
    const state = useBrowserStore.getState()
    return {
      tabs: Object.values(state.tabById).map((tab) => ({
        id: tab.id,
        windowId: tab.windowId,
        index: tab.index,
        groupId: tab.groupId,
        pinned: tab.pinned,
        active: tab.active,
        discarded: tab.discarded,
        audible: tab.audible,
        muted: tab.mutedInfo?.muted,
        title: tab.title,
        url: tab.url,
      })),
      windows: state.windowIds.flatMap((id) => {
        const window = state.windowById[id]
        return window
          ? [{ id: window.id, type: window.type, incognito: window.incognito }]
          : []
      }),
      groups: Object.values(state.tabGroupById).map((group) => ({
        id: group.id,
        windowId: group.windowId,
      })),
    }
  }, [])

  const getCurrentTargetIds = useCallback(
    (
      item?: SelectionItemRef,
      fallbackIds: readonly number[] = [],
    ): number[] => {
      const state = useSelectionStore.getState()
      const latestSnapshot = getCurrentSnapshot()
      const currentSelection = {
        windowIds: state.windowIds,
        expandedWindowIds: state.expandedWindowIds,
        groupIds: state.groupIds,
        tabIds: state.tabIds,
      }
      const selectedTabIds = resolveSelectedTabIds(
        currentSelection,
        latestSnapshot,
      )
      const isSelected = item
        ? isSelectionItemRepresented(item, currentSelection, latestSnapshot)
        : true

      if (item && !isSelected) return [...fallbackIds]
      return selectedTabIds
    },
    [getCurrentSnapshot],
  )

  const reportResult = useCallback(
    (result: BatchTabActionResult, operation: BatchOperation): void => {
      const succeeded = result.succeededIds.length
      const requested = result.requestedIds.length
      if (requested === 0) return

      if (result.failures.length === 0) {
        toast.success(tt(successMessageKeys[operation], succeeded))
        return
      }

      const message = t('toast_nTabsActionPartial', [
        String(succeeded),
        String(requested),
        operationLabels[operation],
      ])
      if (succeeded === 0) toast.error(message)
      else toast.warning(message)
    },
    [],
  )

  const reportTabActionResult = useCallback(
    (result: BatchTabActionResult, action: string): void => {
      const succeeded = result.succeededIds.length
      const requested = result.requestedIds.length
      if (requested === 0) return

      if (result.failures.length === 0) {
        toast.success(
          t('toast_batchTabsActionComplete', [tt('nTabs', succeeded), action]),
        )
        return
      }

      const message = t('toast_nTabsActionPartial', [
        String(succeeded),
        String(requested),
        action,
      ])
      if (succeeded === 0) toast.error(message)
      else toast.warning(message)
    },
    [],
  )

  const reportEntityActionResult = useCallback(
    (
      result: BatchTabActionResult,
      itemSingular: string,
      itemPlural: string,
      actionVerb: string,
    ): void => {
      const succeeded = result.succeededIds.length
      const requested = result.requestedIds.length
      if (requested === 0) return
      const failures = result.failures.length
      const succeededLabel = `${succeeded} ${succeeded === 1 ? itemSingular : itemPlural}`

      if (failures === 0) {
        toast.success(
          t(
            'toast_batchEntityActionComplete',
            `${succeededLabel} ${actionVerb} successfully`,
          ),
        )
        return
      }

      const requestedLabel = `${requested} ${requested === 1 ? itemSingular : itemPlural}`
      const failureLabel = `${failures} ${failures === 1 ? itemSingular : itemPlural}`
      const message = t('toast_batchEntityActionPartial', [
        `${succeededLabel} of ${requestedLabel} ${actionVerb}`,
        failureLabel,
      ])
      if (succeeded === 0) toast.error(message)
      else toast.warning(message)
    },
    [],
  )

  const reconcileSelection = useCallback((nextTabIds: readonly number[]) => {
    useSelectionStore.setState({
      windowIds: new Set(),
      expandedWindowIds: new Set(),
      groupIds: new Set(),
      tabIds: new Set(nextTabIds),
      mode: nextTabIds.length > 1 ? 'multi-select' : 'default',
    })
  }, [])

  const close = useCallback(
    async (item?: SelectionItemRef, fallbackIds?: readonly number[]) => {
      const ids = getCurrentTargetIds(item, fallbackIds)
      const result = await runBatchClose(ids, chromeBatchTabActionPorts)
      reconcileSelection(result.failures.map((failure) => failure.tabId))
      reportResult(result, 'closed')
      return result
    },
    [getCurrentTargetIds, reconcileSelection, reportResult],
  )

  const closeRelativeToTab = useCallback(
    async (tabId: number, direction: 'other' | 'below') => {
      const latest = getCurrentSnapshot()
      const target = latest.tabs.find((tab) => tab.id === tabId)
      if (!target)
        return blockedResult([], 'The selected tab is no longer available.')
      const ids = latest.tabs
        .filter((tab) => {
          if (
            tab.windowId !== target.windowId ||
            tab.pinned ||
            tab.id === tabId
          ) {
            return false
          }
          return direction === 'other' || tab.index > target.index
        })
        .map((tab) => tab.id)
      const result = await runBatchClose(ids, chromeBatchTabActionPorts)
      reconcileSelection([
        tabId,
        ...result.failures.map((failure) => failure.tabId),
      ])
      reportResult(result, 'closed')
      return result
    },
    [getCurrentSnapshot, reconcileSelection, reportResult],
  )

  const discardTabs = useCallback(
    async (ids: readonly number[] = selectedTabIds) => {
      const result = await runBatchDiscardAction(
        ids,
        getCurrentSnapshot(),
        chromeBatchTabActionPorts,
      )
      const succeeded = tt('nTabs', result.succeededIds.length)
      const skipped = tt('nTabs', result.skippedIds.length)
      const failures = tt('nTabs', result.failures.length)

      if (result.failures.length > 0) {
        const message = t('toast_batchDiscardPartial', [
          succeeded,
          skipped,
          failures,
        ])
        if (result.succeededIds.length === 0) toast.error(message)
        else toast.warning(message)
      } else if (result.skippedIds.length > 0) {
        const message = t('toast_batchDiscardSkipped', [succeeded, skipped])
        if (result.succeededIds.length === 0) toast.info(message)
        else toast.success(message)
      } else if (result.succeededIds.length > 0) {
        toast.success(tt('toast_nTabsDiscarded', result.succeededIds.length))
      }
      return result
    },
    [getCurrentSnapshot, selectedTabIds],
  )

  const discardOtherTabs = useCallback(
    async (tabId: number) => {
      const latest = getCurrentSnapshot()
      const target = latest.tabs.find((tab) => tab.id === tabId)
      if (!target) {
        const result = blockedDiscardResult(
          [tabId],
          'The selected tab is no longer available.',
        )
        const message = t('toast_batchDiscardPartial', [
          tt('nTabs', 0),
          tt('nTabs', 0),
          tt('nTabs', result.failures.length),
        ])
        toast.error(message)
        return result
      }
      const siblingIds = latest.tabs
        .filter((tab) => tab.windowId === target.windowId && tab.id !== tabId)
        .map((tab) => tab.id)
      return discardTabs(siblingIds)
    },
    [discardTabs, getCurrentSnapshot],
  )

  const performTabAction = useCallback(
    async (
      action: BatchTabActionName,
      ids: readonly number[] = selectedTabIds,
    ) => {
      if (action === 'discard') return discardTabs(ids)
      const result = await runBatchTabAction(
        ids,
        action,
        chromeBatchTabActionPorts,
      )
      if (action === 'ungroup') reconcileSelection(ids)
      const actionVerb = {
        pin: 'pinned',
        unpin: 'unpinned',
        mute: 'muted',
        unmute: 'unmuted',
        reload: 'reloaded',
        duplicate: 'duplicated',
        discard: 'discarded',
        ungroup: 'ungrouped',
      }[action]
      reportTabActionResult(result, actionVerb)
      return result
    },
    [discardTabs, reconcileSelection, reportTabActionResult, selectedTabIds],
  )

  const copyTabs = useCallback(
    async (
      kind: 'urls' | 'titles' | 'titles-and-urls',
      ids: readonly number[] = selectedTabIds,
    ) => {
      const latest = getCurrentSnapshot()
      const records = ids.flatMap((id) => {
        const tab = latest.tabs.find((candidate) => candidate.id === id)
        if (!tab) return []
        const hasContent =
          kind === 'urls'
            ? Boolean(tab.url)
            : kind === 'titles'
              ? Boolean(tab.title)
              : Boolean(tab.title || tab.url)
        return hasContent ? [tab] : []
      })
      const result = await runBatchClipboardAction(
        records.map((tab) => tab.id),
        formatBatchTabCopyText(records, kind),
        chromeBatchTabActionPorts,
      )
      const successKey =
        kind === 'urls'
          ? 'toast_nUrlsCopied'
          : kind === 'titles'
            ? 'toast_nTitlesCopied'
            : 'toast_nTabDetailsCopied'
      if (result.failures.length === 0 && result.succeededIds.length > 0) {
        toast.success(tt(successKey, result.succeededIds.length))
      } else if (result.failures.length > 0) {
        reportTabActionResult(result, 'copied')
      }
      return result
    },
    [getCurrentSnapshot, reportTabActionResult, selectedTabIds],
  )

  const performWindowAction = useCallback(
    async (action: BatchWindowAction, ids: readonly number[]) => {
      const previousSnapshot = getCurrentSnapshot()
      const result = await runBatchWindowAction(
        ids,
        action,
        chromeBatchTabActionPorts,
      )
      if (action === 'close' && selectedWindowId !== undefined) {
        const closedWindowIds = new Set(result.succeededIds)
        if (closedWindowIds.has(selectedWindowId)) {
          const nextWindow = previousSnapshot.windows.find(
            (window) => !closedWindowIds.has(window.id),
          )
          if (nextWindow) setSelectedWindowId(nextWindow.id)
        }
      }
      reportEntityActionResult(
        result,
        'window',
        'windows',
        action === 'close' ? 'closed' : 'focused',
      )
      return result
    },
    [
      getCurrentSnapshot,
      reportEntityActionResult,
      selectedWindowId,
      setSelectedWindowId,
    ],
  )

  const performGroupAction = useCallback(
    async (action: BatchGroupAction, ids: readonly number[]) => {
      const result = await runBatchGroupAction(
        ids,
        action,
        chromeBatchTabActionPorts,
      )
      if (action.type !== 'rename' && result.failures.length > 0) {
        const actionVerb =
          action.type === 'change-color' ? 'updated' : 'changed'
        reportEntityActionResult(result, 'tab group', 'tab groups', actionVerb)
      }
      return result
    },
    [reportEntityActionResult],
  )

  const moveToWindow = useCallback(
    async (
      targetWindowId: number,
      item?: SelectionItemRef,
      fallbackIds?: readonly number[],
    ) => {
      const ids = getCurrentTargetIds(item, fallbackIds)
      const latest = getCurrentSnapshot()
      const blockReason = getMoveBlockReason(ids, latest, targetWindowId)
      if (blockReason) {
        const result = blockedResult(ids, blockReason)
        reportResult(result, 'moved')
        return result
      }
      const result = await runBatchMoveToWindow(
        ids,
        targetWindowId,
        new Map(latest.tabs.map((tab) => [tab.id, tab.windowId])),
        chromeBatchTabActionPorts,
      )
      reconcileSelection(ids)
      if (result.succeededIds.length > 0) setSelectedWindowId(targetWindowId)
      reportResult(result, 'moved')
      return result
    },
    [
      getCurrentSnapshot,
      getCurrentTargetIds,
      reconcileSelection,
      reportResult,
      setSelectedWindowId,
    ],
  )

  const moveToNewWindow = useCallback(
    async (item?: SelectionItemRef, fallbackIds?: readonly number[]) => {
      const ids = getCurrentTargetIds(item, fallbackIds)
      const latest = getCurrentSnapshot()
      const blockReason = getNewWindowMoveBlockReason(ids, latest)
      if (blockReason) {
        const result = blockedResult(ids, blockReason)
        reportResult(result, 'moved')
        return result
      }
      const result = await runBatchMoveToNewWindow(
        ids,
        chromeBatchTabActionPorts,
      )
      reconcileSelection(ids)
      if (
        result.succeededIds.length > 0 &&
        result.createdTargetId !== undefined
      ) {
        setSelectedWindowId(result.createdTargetId)
      }
      reportResult(result, 'moved')
      return result
    },
    [
      getCurrentSnapshot,
      getCurrentTargetIds,
      reconcileSelection,
      reportResult,
      setSelectedWindowId,
    ],
  )

  const addToGroup = useCallback(
    async (
      targetGroupId: number,
      item?: SelectionItemRef,
      fallbackIds?: readonly number[],
    ) => {
      const ids = getCurrentTargetIds(item, fallbackIds)
      const latest = getCurrentSnapshot()
      const reason = getGroupActionBlockReason(ids, latest)
      const targetGroup = latest.groups.find(
        (group) => group.id === targetGroupId,
      )
      const sourceWindowId = latest.tabs.find(
        (tab) => tab.id === ids[0],
      )?.windowId
      const targetReason = targetGroup
        ? sourceWindowId !== targetGroup.windowId
          ? 'Selected tabs must be in the target group’s window.'
          : undefined
        : 'The target group is no longer available.'
      if (reason || targetReason) {
        const result = blockedResult(ids, reason ?? targetReason!)
        reportResult(result, 'grouped')
        return result
      }
      const result = await runBatchAddToGroup(
        ids,
        targetGroupId,
        chromeBatchTabActionPorts,
      )
      reconcileSelection(ids)
      reportResult(result, 'grouped')
      return result
    },
    [getCurrentSnapshot, getCurrentTargetIds, reconcileSelection, reportResult],
  )

  const createGroup = useCallback(
    async (
      targetWindowId: number,
      item?: SelectionItemRef,
      fallbackIds?: readonly number[],
    ) => {
      const ids = getCurrentTargetIds(item, fallbackIds)
      const latest = getCurrentSnapshot()
      const reason = getGroupActionBlockReason(ids, latest)
      const sourceWindowId = latest.tabs.find(
        (tab) => tab.id === ids[0],
      )?.windowId
      const targetWindow = latest.windows.find(
        (window) => window.id === targetWindowId,
      )
      const targetReason =
        targetWindowId !== sourceWindowId
          ? 'Selected tabs must be in the same window to create a group.'
          : !targetWindow || targetWindow.type !== 'normal'
            ? 'A new group requires a normal window.'
            : undefined
      if (reason || targetReason) {
        const result = blockedResult(ids, reason ?? targetReason!)
        reportResult(result, 'grouped')
        return result
      }
      const result = await runBatchCreateGroup(
        ids,
        targetWindowId,
        chromeBatchTabActionPorts,
      )
      reconcileSelection(ids)
      reportResult(result, 'grouped')
      return result
    },
    [getCurrentSnapshot, getCurrentTargetIds, reconcileSelection, reportResult],
  )

  return {
    selectedTabIds,
    snapshot,
    selection,
    close,
    closeRelativeToTab,
    discardTabs,
    discardOtherTabs,
    moveToWindow,
    moveToNewWindow,
    addToGroup,
    createGroup,
    performTabAction,
    performWindowAction,
    performGroupAction,
    copyTabs,
    getCurrentTargetIds,
    getCurrentSnapshot,
    moveBlockReason: useCallback(
      (targetWindowId: number) =>
        getMoveBlockReason(selectedTabIds, snapshot, targetWindowId),
      [selectedTabIds, snapshot],
    ),
    moveNewWindowBlockReason: getNewWindowMoveBlockReason(
      selectedTabIds,
      snapshot,
    ),
    groupBlockReason: getGroupActionBlockReason(selectedTabIds, snapshot),
  }
}

const blockedResult = (
  ids: readonly number[],
  message: string,
): BatchTabActionResult => ({
  requestedIds: [...ids],
  succeededIds: [],
  failures: ids.map((tabId) => ({ tabId, message })),
})

const blockedDiscardResult = (
  ids: readonly number[],
  message: string,
): BatchDiscardActionResult => ({
  requestedIds: [...ids],
  succeededIds: [],
  failures: ids.map((tabId) => ({ tabId, message })),
  skippedIds: [],
})
