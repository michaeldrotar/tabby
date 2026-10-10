import { resolveSelectedTabIds } from '@extension/core/actions/batchTabActions'
import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
  reduceSelectionIntent,
} from '@extension/core/selection/SelectionModel'
import type { TabbyResources } from './TabbyProvider'
import type { TabManagerViewState } from './view'
import type { BrowserSnapshot, CommandOutcome } from '@extension/core'
import type {
  PaneContext,
  SelectionItemRef,
} from '@extension/core/selection/SelectionModel'
import type {
  TabManagerIntent,
  TabManagerViewModel,
} from '@extension/ui/tab-manager/TabManager'

const sameItem = (
  a: SelectionItemRef | null | undefined,
  b: SelectionItemRef | null | undefined,
) => a?.type === b?.type && a?.id === b?.id

export const getTabManagerOrder = (
  snapshot: BrowserSnapshot,
  viewedWindowId: number | null,
): SelectionItemRef[] => {
  const order: SelectionItemRef[] = []
  const seenGroups = new Set<number>()
  for (const tab of snapshot.tabs
    .filter((tab) => tab.windowId === viewedWindowId)
    .sort((a, b) => a.index - b.index)) {
    const group = snapshot.groups.find((group) => group.id === tab.groupId)
    if (group && !seenGroups.has(group.id)) {
      order.push({ type: 'group', id: group.id })
      seenGroups.add(group.id)
    }
    if (!group?.collapsed) order.push({ type: 'tab', id: tab.id })
  }
  return order
}

const itemExists = (snapshot: BrowserSnapshot, item: SelectionItemRef) =>
  (item.type === 'window'
    ? snapshot.windows
    : item.type === 'group'
      ? snapshot.groups
      : snapshot.tabs
  ).some((record) => record.id === item.id)

export const reconcileTabManagerView = (
  snapshot: BrowserSnapshot,
  state: TabManagerViewState,
): TabManagerViewState => {
  if (snapshot.state !== 'loaded') return state
  const windowIds = new Set(snapshot.windows.map((window) => window.id))
  const groupIds = new Set(snapshot.groups.map((group) => group.id))
  const tabIds = new Set(snapshot.tabs.map((tab) => tab.id))
  const previous = state.selection.selection
  const filter = (ids: Set<number>, valid: Set<number>) =>
    new Set([...ids].filter((id) => valid.has(id)))
  const selection = {
    ...previous,
    windowIds: filter(previous.windowIds, windowIds),
    expandedWindowIds: filter(previous.expandedWindowIds, windowIds),
    groupIds: filter(previous.groupIds, groupIds),
    tabIds: filter(previous.tabIds, tabIds),
  }
  const selectedWindow = windowIds.has(state.viewedWindowId ?? -1)
    ? state.viewedWindowId
    : (snapshot.windows.find((window) => window.focused)?.id ??
      snapshot.windows[0]?.id ??
      null)
  const selectionChanged = (
    ['windowIds', 'expandedWindowIds', 'groupIds', 'tabIds'] as const
  ).some((key) => selection[key].size !== previous[key].size)
  const order = getTabManagerOrder(snapshot, selectedWindow)
  const removedFocus =
    state.focusedItem &&
    (state.focusedItem.type === 'window'
      ? !windowIds.has(state.focusedItem.id)
      : !order.some((item) => sameItem(item, state.focusedItem)))
  const focusedItem = removedFocus ? (order[0] ?? null) : state.focusedItem
  const anchor = state.selection.interaction.anchorItem
  const invalidAnchor = anchor && !itemExists(snapshot, anchor)
  const base = state.selection.interaction.baseSelection
  const invalidBase =
    base &&
    (base.tabIds.size !== filter(base.tabIds, tabIds).size ||
      base.groupIds.size !== filter(base.groupIds, groupIds).size ||
      base.windowIds.size !== filter(base.windowIds, windowIds).size)
  const invalidMenu =
    state.actionMenu?.target && !itemExists(snapshot, state.actionMenu.target)
  if (
    !selectionChanged &&
    selectedWindow === state.viewedWindowId &&
    !removedFocus &&
    !invalidAnchor &&
    !invalidBase &&
    !invalidMenu
  ) {
    return state
  }
  return {
    ...state,
    viewedWindowId: selectedWindow,
    focusedItem,
    actionMenu: invalidMenu ? null : state.actionMenu,
    selection: {
      selection,
      interaction:
        invalidAnchor || invalidBase
          ? createSelectionInteractionState()
          : state.selection.interaction,
    },
  }
}

const ageLabel = (timestamp: number | undefined, now: number) => {
  if (timestamp === undefined) return undefined
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000))
  if (minutes === 0) return 'just now'
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1440)}d`
}

export const projectTabManager = (
  snapshot: BrowserSnapshot,
  state: TabManagerViewState,
  now: number,
): TabManagerViewModel => ({
  status:
    snapshot.state === 'loaded'
      ? 'ready'
      : snapshot.state === 'error'
        ? 'error'
        : 'loading',
  error: snapshot.error,
  windows: snapshot.windows.map((window) => ({
    id: window.id,
    title: `Window ${window.id}`,
    active: window.focused,
    tabs: snapshot.tabs
      .filter((tab) => tab.windowId === window.id)
      .sort((a, b) => a.index - b.index)
      .map((tab) => ({
        id: tab.id,
        title: tab.title ?? 'Untitled',
        url: tab.url,
        faviconUrl: tab.faviconUrl,
        active: tab.active,
        loading: tab.loading,
        pinned: tab.pinned,
        discarded: tab.discarded,
        audio: tab.muted ? 'muted' : tab.audible ? 'on' : 'off',
        groupId: tab.groupId,
        ageLabel: ageLabel(tab.lastAccessed, now),
      })),
    groups: snapshot.groups
      .filter((group) => group.windowId === window.id)
      .map((group) => ({ ...group })),
  })),
  viewedWindowId: state.viewedWindowId,
  selectedTabIds: resolveSelectedTabIds(state.selection.selection, snapshot),
  selectedGroupIds: [...state.selection.selection.groupIds],
  selectedWindowIds: [...state.selection.selection.windowIds],
  selectionMode: state.selection.selection.mode,
  sidebarExpanded: state.sidebarExpanded,
  focusedItem: state.focusedItem,
  hoveredItem: state.hoveredItem,
  actionMenu: state.actionMenu,
  notice: state.notice,
  scrollTop: state.scrollTop,
})

const describeOutcome = (outcome: CommandOutcome, action: string) => {
  if (outcome.status === 'ignored') return `${action} ignored; data unchanged.`
  if (outcome.status === 'failed') {
    return outcome.failures[0]?.message ?? `${action} could not be completed.`
  }
  if (outcome.status === 'partial') {
    return `${outcome.succeededIds.length} succeeded; ${outcome.failures.length} failed.`
  }
  return `${action} complete.`
}

export const createTabManagerController = (resources: TabbyResources) => {
  let generation = 0
  const { backend, view } = resources
  const reconcile = () => {
    const current = view.getState()
    const next = reconcileTabManagerView(backend.getSnapshot(), current)
    if (next !== current) view.setState(next, true)
  }
  const execute = async (
    command: Parameters<typeof backend.execute>[0],
    label: string,
  ) => {
    const operation = generation
    view.setState({ actionMenu: null, notice: null })
    let outcome: CommandOutcome
    try {
      outcome = await backend.execute(command)
    } catch (error) {
      if (operation !== generation) return
      view.setState({
        notice: {
          message: error instanceof Error ? error.message : 'Action failed.',
          kind: 'error',
        },
      })
      return
    }
    if (operation !== generation) return
    reconcile()
    const created = outcome.createdWindowIds?.[0]
    if (created !== undefined) view.setState({ viewedWindowId: created })
    view.setState({
      notice: {
        message: describeOutcome(outcome, label),
        kind: outcome.status === 'failed' ? 'error' : 'info',
      },
    })
  }
  const dispatch = (intent: TabManagerIntent): void | Promise<void> => {
    reconcile()
    const snapshot = backend.getSnapshot()
    const state = view.getState()
    if (intent.type === 'view-window') {
      view.setState({ viewedWindowId: intent.windowId, scrollTop: 0 })
    } else if (intent.type === 'toggle-sidebar') {
      view.setState({ sidebarExpanded: !state.sidebarExpanded })
    } else if (intent.type === 'scroll') {
      if (state.scrollTop !== intent.top)
        view.setState({ scrollTop: intent.top })
    } else if (intent.type === 'select-item') {
      const item = intent.item
      const order =
        item.type === 'window'
          ? snapshot.windows.map((window) => ({
              type: 'window' as const,
              id: window.id,
            }))
          : getTabManagerOrder(snapshot, state.viewedWindowId)
      view.setState({
        selection: reduceSelectionIntent(state.selection, {
          type: 'click',
          item,
          pane: item.type === 'window' ? 'window' : 'tab',
          orderedItems: order,
          shift: intent.shift ?? false,
          toggle: intent.toggle ?? false,
        }),
        focusedItem: item,
        ...(item.type === 'window'
          ? { viewedWindowId: item.id, scrollTop: 0 }
          : {}),
      })
    } else if (intent.type === 'navigate') {
      if (
        intent.key === 'ContextMenu' ||
        (intent.shift && (intent.key === 'F10' || intent.key === 'Enter'))
      ) {
        return dispatch({ type: 'open-action-menu' })
      }
      if (
        ![
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Home',
          'End',
          ' ',
          'Escape',
          'Enter',
          'Delete',
          'Backspace',
        ].includes(intent.key) &&
        !(intent.toggle && intent.key.toLowerCase() === 'a')
      )
        return
      const pane: PaneContext =
        state.focusedItem?.type === 'window' ? 'window' : 'tab'
      if (intent.key === 'ArrowLeft' || intent.key === 'ArrowRight') {
        const targetPane = intent.key === 'ArrowLeft' ? 'window' : 'tab'
        if (targetPane === pane) return
        const visibleOrder = getTabManagerOrder(snapshot, state.viewedWindowId)
        const target =
          targetPane === 'window'
            ? snapshot.windows.find(
                (window) => window.id === state.viewedWindowId,
              )
            : snapshot.tabs.find(
                (tab) =>
                  tab.windowId === state.viewedWindowId &&
                  tab.active &&
                  visibleOrder.some(
                    (item) => item.type === 'tab' && item.id === tab.id,
                  ),
              )
        const item = target
          ? { type: targetPane as 'window' | 'tab', id: target.id }
          : visibleOrder[0]
        if (!item) return
        view.setState({
          selection: reduceSelectionIntent(state.selection, {
            type: 'arrow',
            item,
            pane: targetPane,
            forceSingleSelect: true,
          }),
          focusedItem: item,
        })
        return
      }
      const order =
        pane === 'window'
          ? snapshot.windows.map((window) => ({
              type: 'window' as const,
              id: window.id,
            }))
          : getTabManagerOrder(snapshot, state.viewedWindowId)
      const index = order.findIndex((item) => sameItem(item, state.focusedItem))
      const delta = intent.key === 'ArrowUp' ? -1 : 1
      const item =
        intent.key === 'Home'
          ? order[0]
          : intent.key === 'End'
            ? order.at(-1)
            : intent.key.startsWith('Arrow')
              ? order[Math.max(0, Math.min(order.length - 1, index + delta))]
              : (state.focusedItem ?? order[0])
      if (!item) return
      if (intent.key === 'Delete' || intent.key === 'Backspace') {
        return dispatch({ type: 'close-selection' })
      }
      if (intent.key === 'Enter') {
        if (item.type === 'tab')
          return dispatch({ type: 'activate-tab', tabId: item.id })
        if (item.type === 'window') {
          return dispatch({ type: 'activate-window', windowId: item.id })
        }
        return
      }
      if (intent.key === 'Escape' && state.actionMenu) {
        view.setState({ actionMenu: null })
        return
      }
      const modelIntent =
        intent.key === ' '
          ? { type: 'space' as const, item, pane }
          : intent.key === 'Escape'
            ? { type: 'escape' as const, item, pane }
            : intent.toggle && intent.key.toLowerCase() === 'a'
              ? { type: 'select-all' as const, pane, orderedItems: order }
              : intent.shift
                ? {
                    type: 'shift-arrow' as const,
                    item,
                    pane,
                    focusedBeforeMove: state.focusedItem ?? undefined,
                    orderedItems: order,
                  }
                : { type: 'arrow' as const, item, pane }
      view.setState({
        selection: reduceSelectionIntent(state.selection, modelIntent),
        focusedItem: item,
        ...(item.type === 'window' ? { viewedWindowId: item.id } : {}),
      })
    } else if (intent.type === 'create-window') {
      return execute({ type: 'create-window' }, 'Create window')
    } else if (intent.type === 'close-tabs') {
      return execute(
        { type: 'close-tabs', tabIds: intent.tabIds },
        'Close tabs',
      )
    } else if (intent.type === 'close-window') {
      return execute(intent, 'Close window')
    } else if (intent.type === 'activate-tab') {
      return execute(intent, 'Activate tab')
    } else if (intent.type === 'activate-window') {
      return execute(intent, 'Activate window')
    } else if (intent.type === 'set-group-collapsed') {
      return execute(intent, 'Change group')
    } else if (intent.type === 'close-selection') {
      const ids = resolveSelectedTabIds(state.selection.selection, snapshot)
      if (ids.length > 0) {
        return execute({ type: 'close-tabs', tabIds: ids }, 'Close tabs')
      }
    } else if (intent.type === 'open-action-menu') {
      if (intent.target) {
        const target = intent.target
        const represented =
          target.type === 'tab'
            ? projectTabManager(
                snapshot,
                state,
                resources.environment.now(),
              ).selectedTabIds.includes(target.id)
            : target.type === 'group'
              ? state.selection.selection.groupIds.has(target.id)
              : state.selection.selection.windowIds.has(target.id)
        if (!represented) {
          dispatch({ type: 'select-item', item: target })
        }
      }
      view.setState({ actionMenu: { target: intent.target } })
    } else if (intent.type === 'dismiss-action-menu') {
      view.setState({ actionMenu: null })
    } else if (intent.type === 'dismiss-notice') {
      view.setState({ notice: null })
    }
  }
  return {
    dispatch,
    reconcile,
    cancel: () => {
      generation++
    },
    clearSelection: () => {
      view.setState({
        selection: {
          selection: { ...createEmptySelectionSnapshot(), mode: 'default' },
          interaction: createSelectionInteractionState(),
        },
      })
    },
  }
}

export type TabManagerController = ReturnType<typeof createTabManagerController>
