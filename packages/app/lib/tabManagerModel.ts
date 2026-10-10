import {
  isSelectionItemRepresented,
  resolveSelectedTabIds,
  resolveSelectionItemTabIds,
} from '@extension/core/actions/batchTabActions'
import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
  reduceSelectionIntent,
  remapSelectionInteractionTabIds,
} from '@extension/core/selection/SelectionModel'
import {
  findTabIdReplacements,
  remapSelectedTabIds,
} from '@extension/core/selection/TabIdentity'
import { formatTimeAgo } from '@extension/core/time'
import { tt } from '@extension/i18n/catalog'
import { createNotificationController } from './notifications'
import { getTabManagerActions } from './tabManagerActions'
import type { TabManagerResources } from './TabbyProvider'
import type { ManagerActionOptions } from './tabManagerActions'
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
    !invalidMenu &&
    (state.renamingGroupId === null || groupIds.has(state.renamingGroupId))
  ) {
    return state
  }
  return {
    ...state,
    viewedWindowId: selectedWindow,
    focusedItem,
    actionMenu: invalidMenu ? null : state.actionMenu,
    actionPanel: invalidMenu ? null : state.actionPanel,
    renamingGroupId: groupIds.has(state.renamingGroupId ?? -1)
      ? state.renamingGroupId
      : null,
    renamingGroupTitle: groupIds.has(state.renamingGroupId ?? -1)
      ? state.renamingGroupTitle
      : null,
    selection: {
      selection,
      interaction:
        invalidAnchor || invalidBase
          ? createSelectionInteractionState()
          : state.selection.interaction,
    },
  }
}

// Snapshot-owned cache keeps browser rows stable while local scroll, focus, menus,
// and selection change. Age labels follow the injected clock at their visible resolution.
const projectedWindows = new WeakMap<
  BrowserSnapshot,
  {
    clockKey: string
    windows: TabManagerViewModel['windows']
    duplicateTabIds: number[]
  }
>()
const projectWindows = (
  snapshot: BrowserSnapshot,
  now: number,
  minutePrecision = false,
) => {
  const ageLabels = snapshot.tabs.map((tab) =>
    formatTimeAgo(tab.lastAccessed, now, minutePrecision),
  )
  const clockKey = ageLabels.join('|')
  const cached = projectedWindows.get(snapshot)
  if (cached?.clockKey === clockKey) return cached
  const ageLabelsById = new Map(
    snapshot.tabs.map((tab, index) => [tab.id, ageLabels[index]]),
  )
  const tabsByWindow = new Map<number, BrowserSnapshot['tabs'][number][]>()
  const groupsByWindow = new Map<number, BrowserSnapshot['groups'][number][]>()
  const urls = new Map<string, number[]>()
  for (const tab of snapshot.tabs) {
    const list = tabsByWindow.get(tab.windowId) ?? []
    list.push(tab)
    tabsByWindow.set(tab.windowId, list)
    if (tab.url) {
      const matching = urls.get(tab.url) ?? []
      matching.push(tab.id)
      urls.set(tab.url, matching)
    }
  }
  for (const group of snapshot.groups) {
    const list = groupsByWindow.get(group.windowId) ?? []
    list.push(group)
    groupsByWindow.set(group.windowId, list)
  }
  const windows = snapshot.windows.map((window) => {
    const tabs = (tabsByWindow.get(window.id) ?? []).sort(
      (a, b) => a.index - b.index,
    )
    const active = tabs.find((tab) => tab.active)
    return {
      id: window.id,
      title: active?.title || `Window ${window.id}`,
      iconUrl: active?.faviconUrl,
      incognito: window.incognito,
      active: window.focused,
      tabs: tabs.map((tab) => ({
        id: tab.id,
        title: tab.title || 'Untitled',
        url: tab.url,
        faviconUrl: tab.faviconUrl,
        active: tab.active,
        loading: tab.loading,
        blurred: Boolean(tab.loading && !tab.hasLoaded),
        renderKey: tab.renderKey,
        pinned: tab.pinned,
        discarded: tab.discarded,
        audio: tab.muted
          ? ('muted' as const)
          : tab.audible
            ? ('on' as const)
            : ('off' as const),
        groupId: tab.groupId,
        ageLabel: ageLabelsById.get(tab.id),
      })),
      groups: (groupsByWindow.get(window.id) ?? []).map((group) => ({
        ...group,
      })),
    }
  })
  const value = {
    clockKey,
    windows,
    duplicateTabIds: [...urls.values()].filter((ids) => ids.length > 1).flat(),
  }
  projectedWindows.set(snapshot, value)
  return value
}
export const projectTabManager = (
  snapshot: BrowserSnapshot,
  state: TabManagerViewState,
  now: number,
  options: ManagerActionOptions = {},
): TabManagerViewModel => {
  const data = projectWindows(snapshot, now, options.reduceAgePrecision)
  const catalog = getTabManagerActions(snapshot, state, options)
  const selectedGroupIds = [
    ...new Set([
      ...state.selection.selection.groupIds,
      ...snapshot.groups
        .filter((group) =>
          state.selection.selection.windowIds.has(group.windowId),
        )
        .map((group) => group.id),
    ]),
  ]
  return {
    status:
      snapshot.state === 'loaded'
        ? 'ready'
        : snapshot.state === 'error'
          ? 'error'
          : 'loading',
    error: snapshot.error,
    windows: data.windows,
    duplicateTabIds: data.duplicateTabIds,
    actions: catalog.actions,
    contextActions: catalog.actions,
    actionPanel: state.actionPanel,
    renamingGroupId: state.renamingGroupId,
    renamingGroupTitle: state.renamingGroupTitle,
    scrollToItem: state.scrollToItem,
    viewedWindowId: state.viewedWindowId,
    selectedTabIds: resolveSelectedTabIds(state.selection.selection, snapshot),
    selectedGroupIds,
    selectedGroupCount: selectedGroupIds.length,
    selectedWindowIds: [...state.selection.selection.windowIds],
    selectionMode: state.selection.selection.mode,
    sidebarExpanded: state.sidebarExpanded ?? options.compactLayout === 'list',
    focusedItem: state.focusedItem,
    hoveredItem: state.hoveredItem,
    actionMenu: state.actionMenu,
    notifications: state.notifications,
    scrollTop: state.scrollTop,
  }
}

const describeOutcome = (
  outcome: CommandOutcome,
  action: string,
  command?: Parameters<TabManagerResources['backend']['execute']>[0],
) => {
  if (outcome.skippedActiveIds || outcome.skippedAlreadyDiscardedIds) {
    const count = outcome.succeededIds.length
    const skipped =
      (outcome.skippedActiveIds?.length ?? 0) +
      (outcome.skippedAlreadyDiscardedIds?.length ?? 0)
    return count
      ? `${count} ${count === 1 ? 'tab' : 'tabs'} discarded${outcome.failures.length ? `; ${outcome.failures.length} failed` : ''}.`
      : `No tabs discarded${skipped ? `; ${skipped} ineligible` : ''}${outcome.failures.length ? `; ${outcome.failures.length} failed` : ''}.`
  }
  if (outcome.status === 'ignored') return `${action} ignored; data unchanged.`
  if (outcome.status === 'failed') {
    return outcome.failures[0]?.message ?? `${action} could not be completed.`
  }
  if (outcome.status === 'partial') {
    return `${outcome.succeededIds.length} succeeded; ${outcome.failures.length} failed.`
  }
  if (command?.type === 'close-tabs' || command?.type === 'close-relative-tabs')
    return tt('toast_nTabsClosed', outcome.succeededIds.length)
  if (command?.type === 'move-tabs')
    return tt('toast_nTabsMoved', outcome.succeededIds.length)
  if (command?.type === 'group-tabs')
    return tt('toast_nTabsGrouped', outcome.succeededIds.length)
  return `${action} complete.`
}

export const createTabManagerController = (resources: TabManagerResources) => {
  let generation = 0
  const { backend, view } = resources
  const notifications = createNotificationController(
    view,
    resources.environment,
  )
  const setNotice = notifications.publish
  let previousSnapshot = backend.getSnapshot()
  const getActions = (snapshot: BrowserSnapshot, state: TabManagerViewState) =>
    getTabManagerActions(snapshot, state, {
      identificationMode:
        resources.preferences.getSnapshot().tabManagerCompactIconMode,
      isMac: resources.environment.platform === 'mac',
    })
  const reconcile = () => {
    let current = view.getState()
    const snapshot = backend.getSnapshot()
    if (snapshot !== previousSnapshot) {
      const replacements = findTabIdReplacements(
        previousSnapshot.tabs,
        snapshot.tabs,
      )
      if (replacements.size > 0) {
        const remap = (item: SelectionItemRef | null | undefined) =>
          item?.type === 'tab' && replacements.has(item.id)
            ? { ...item, id: replacements.get(item.id)! }
            : item
        current = {
          ...current,
          selection: {
            selection: {
              ...current.selection.selection,
              tabIds: remapSelectedTabIds(
                current.selection.selection.tabIds,
                replacements,
              ),
            },
            interaction: remapSelectionInteractionTabIds(
              current.selection.interaction,
              replacements,
            ),
          },
          focusedItem: remap(current.focusedItem) ?? null,
          hoveredItem: remap(current.hoveredItem) ?? null,
          actionMenu: current.actionMenu
            ? {
                ...current.actionMenu,
                target: remap(current.actionMenu.target) ?? undefined,
              }
            : null,
          scrollToItem:
            current.scrollToItem && replacements.has(current.scrollToItem.id)
              ? {
                  ...current.scrollToItem,
                  id: replacements.get(current.scrollToItem.id)!,
                }
              : current.scrollToItem,
        }
        view.setState(current, true)
      }
      previousSnapshot = snapshot
    }
    const next = reconcileTabManagerView(snapshot, current)
    if (next !== current) view.setState(next, true)
  }
  const execute = async (
    command: Parameters<typeof backend.execute>[0],
    label: string,
  ) => {
    const operation = ++generation
    const previous = backend.getSnapshot()
    const requestedTabIds = 'tabIds' in command ? [...command.tabIds] : []
    view.setState({
      actionMenu: null,
      actionPanel: null,
      renamingGroupTitle:
        command.type === 'group-action' && command.action.type === 'rename'
          ? view.getState().renamingGroupTitle
          : null,
      renamingGroupId:
        command.type === 'group-action' && command.action.type === 'rename'
          ? view.getState().renamingGroupId
          : null,
    })
    let outcome: CommandOutcome
    try {
      outcome = await backend.execute(command)
    } catch (error) {
      if (operation !== generation) return
      setNotice({
        message: error instanceof Error ? error.message : 'Action failed.',
        kind: 'error',
      })
      return
    }
    if (operation !== generation) return
    reconcile()
    const applied = outcome.status === 'success' || outcome.status === 'partial'
    const nextSelectedIds =
      outcome.status === 'ignored'
        ? undefined
        : command.type === 'close-tabs'
          ? outcome.failures.map((failure) => failure.id)
          : command.type === 'close-relative-tabs'
            ? [command.tabId, ...outcome.failures.map((failure) => failure.id)]
            : applied &&
                (command.type === 'move-tabs' ||
                  command.type === 'group-tabs' ||
                  (command.type === 'tab-action' &&
                    command.action === 'ungroup'))
              ? requestedTabIds
              : undefined
    if (nextSelectedIds) {
      const current = backend.getSnapshot()
      const survivingIds = new Set(current.tabs.map((tab) => tab.id))
      const remappedIds = remapSelectedTabIds(
        new Set(nextSelectedIds),
        findTabIdReplacements(previous.tabs, current.tabs),
      )
      const tabIds = new Set(
        [...remappedIds].filter((id) => survivingIds.has(id)),
      )
      view.setState({
        selection: {
          selection: {
            ...createEmptySelectionSnapshot(),
            tabIds,
            mode: tabIds.size > 1 ? 'multi-select' : 'default',
          },
          interaction: createSelectionInteractionState(),
        },
      })
    }
    if (
      command.type === 'move-tabs' &&
      outcome.succeededIds.length &&
      applied
    ) {
      const destination = command.windowId ?? outcome.createdWindowIds?.[0]
      if (destination !== undefined) {
        view.setState({ viewedWindowId: destination, scrollTop: 0 })
        reconcile()
      }
    }
    if (command.type === 'create-tab') {
      const id = outcome.createdTabIds?.[0]
      const tab = backend.getSnapshot().tabs.find((tab) => tab.id === id)
      if (tab) {
        const state = view.getState()
        const item = { type: 'tab' as const, id: tab.id }
        view.setState({
          viewedWindowId: tab.windowId,
          focusedItem: item,
          selection: reduceSelectionIntent(state.selection, {
            type: 'arrow',
            item,
            pane: 'tab',
            forceSingleSelect: true,
          }),
          scrollToItem: {
            id: tab.id,
            revision: (state.scrollToItem?.revision ?? 0) + 1,
          },
        })
      }
    }
    if (
      command.type === 'group-action' &&
      command.action.type === 'rename' &&
      outcome.status !== 'failed'
    ) {
      view.setState({ renamingGroupId: null, renamingGroupTitle: null })
    }
    const created = outcome.createdWindowIds?.[0]
    if (created !== undefined)
      view.setState({ viewedWindowId: created, scrollTop: 0 })
    const openWindowId =
      command.type === 'activate-window' &&
      outcome.succeededIds.includes(command.windowId)
        ? command.windowId
        : command.type === 'create-window' && applied
          ? created
          : undefined
    if (openWindowId !== undefined) {
      try {
        await resources.host?.openWindowTabManager?.(openWindowId)
      } catch (error) {
        if (operation === generation)
          setNotice({
            message:
              error instanceof Error
                ? error.message
                : 'Could not open the window’s Tab Manager.',
            kind: 'error',
          })
        return
      }
      if (operation !== generation) return
      const active = backend
        .getSnapshot()
        .tabs.find((tab) => tab.windowId === openWindowId && tab.active)
      view.setState({
        viewedWindowId: openWindowId,
        ...(active
          ? {
              scrollToItem: {
                id: active.id,
                revision: (view.getState().scrollToItem?.revision ?? 0) + 1,
              },
            }
          : {}),
      })
    }
    if (command.type === 'activate-tab' && outcome.status === 'success') return
    setNotice({
      message: describeOutcome(outcome, label, command),
      kind: outcome.status === 'failed' ? 'error' : 'info',
    })
  }
  const closeItem = (item: SelectionItemRef): void | Promise<void> => {
    if (item.type === 'window')
      return execute(
        { type: 'close-window', windowId: item.id },
        'Close window',
      )
    const snapshot = backend.getSnapshot()
    const selection = view.getState().selection.selection
    const ids = isSelectionItemRepresented(item, selection, snapshot)
      ? resolveSelectedTabIds(selection, snapshot)
      : resolveSelectionItemTabIds(item, snapshot)
    if (ids.length)
      return execute({ type: 'close-tabs', tabIds: ids }, 'Close tabs')
  }
  const dispatch = (intent: TabManagerIntent): void | Promise<void> => {
    reconcile()
    const snapshot = backend.getSnapshot()
    const state = view.getState()
    if (intent.type === 'run-action') {
      const catalog = getActions(snapshot, state)
      const descriptor = catalog.actions.find(
        (action) => action.id === intent.actionId,
      )
      if (!descriptor || descriptor.disabled) return
      const selectedOption =
        intent.optionId === undefined
          ? undefined
          : descriptor.options?.find((option) => option.id === intent.optionId)
      if (selectedOption?.disabled) return
      const operation = catalog.operations.get(
        intent.optionId === undefined
          ? intent.actionId
          : `${intent.actionId}:${intent.optionId}`,
      )
      if (!operation) return
      if (operation.type === 'command')
        return execute(operation.command, operation.label)
      if (operation.type === 'rename') {
        view.setState({
          actionMenu: null,
          actionPanel: null,
          renamingGroupId: operation.groupId,
          renamingGroupTitle:
            snapshot.groups.find((group) => group.id === operation.groupId)
              ?.title ?? '',
        })
        return
      }
      if (operation.type === 'copy') {
        const activeGeneration = ++generation
        view.setState({ actionMenu: null, actionPanel: null })
        return (async () => {
          try {
            if (!resources.host?.writeClipboardText)
              throw new Error('Clipboard access is unavailable.')
            await resources.host.writeClipboardText(operation.text)
            if (activeGeneration === generation)
              setNotice({
                message: `${operation.label} complete.`,
                kind: 'info',
              })
          } catch (error) {
            if (activeGeneration === generation)
              setNotice({
                message:
                  error instanceof Error ? error.message : 'Copy failed.',
                kind: 'error',
              })
          }
        })()
      }
    } else if (intent.type === 'open-action-panel') {
      const action = getActions(snapshot, state).actions.find(
        (action) => action.id === intent.actionId,
      )
      if (action?.panel && !action.disabled)
        view.setState({ actionPanel: { actionId: intent.actionId } })
    } else if (intent.type === 'dismiss-action-panel') {
      view.setState({ actionPanel: null })
    } else if (intent.type === 'start-group-rename') {
      if (snapshot.groups.some((group) => group.id === intent.groupId))
        view.setState({
          renamingGroupId: intent.groupId,
          renamingGroupTitle:
            snapshot.groups.find((group) => group.id === intent.groupId)
              ?.title ?? '',
          actionMenu: null,
          actionPanel: null,
        })
    } else if (intent.type === 'change-group-rename') {
      if (state.renamingGroupId === intent.groupId)
        view.setState({ renamingGroupTitle: intent.title })
    } else if (intent.type === 'rename-group') {
      const title = intent.title.trim()
      if (
        title ===
        (
          snapshot.groups.find((group) => group.id === intent.groupId)?.title ??
          ''
        ).trim()
      ) {
        view.setState({ renamingGroupId: null, renamingGroupTitle: null })
        return
      }
      return execute(
        {
          type: 'group-action',
          groupIds: [intent.groupId],
          action: { type: 'rename', title },
        },
        'Rename group',
      )
    } else if (intent.type === 'cancel-group-rename') {
      view.setState({ renamingGroupId: null, renamingGroupTitle: null })
    } else if (intent.type === 'create-tab') {
      return execute(intent, 'Create tab')
    } else if (
      intent.type === 'open-search' ||
      intent.type === 'open-settings'
    ) {
      const operation = generation
      const action =
        intent.type === 'open-search'
          ? resources.host?.openSearch
          : resources.host?.openOptions
      if (!action) return
      return Promise.resolve()
        .then(action)
        .catch((error) => {
          if (operation === generation)
            setNotice({
              message:
                error instanceof Error
                  ? error.message
                  : 'Could not open the requested page.',
              kind: 'error',
            })
        })
    } else if (intent.type === 'scroll-to-active') {
      const active = snapshot.tabs.find(
        (tab) =>
          tab.windowId ===
            (resources.host?.getCurrentWindowId?.() ?? state.viewedWindowId) &&
          tab.active,
      )
      if (active) {
        view.setState({ viewedWindowId: active.windowId })
        view.setState({
          scrollToItem: {
            id: active.id,
            revision: (state.scrollToItem?.revision ?? 0) + 1,
          },
        })
        const group = snapshot.groups.find(
          (group) => group.id === active.groupId,
        )
        if (group?.collapsed)
          return execute(
            {
              type: 'set-group-collapsed',
              groupId: group.id,
              collapsed: false,
            },
            'Expand group',
          )
      }
    } else if (intent.type === 'clear-selection') {
      clearSelection()
    } else if (intent.type === 'toggle-selection-mode') {
      view.setState({
        selection: {
          ...state.selection,
          selection: {
            ...state.selection.selection,
            mode:
              state.selection.selection.mode === 'default'
                ? 'multi-select'
                : 'default',
          },
        },
      })
    } else if (intent.type === 'view-window') {
      view.setState({
        viewedWindowId: intent.windowId,
        scrollTop: 0,
        actionMenu: null,
        actionPanel: null,
        renamingGroupId: null,
        renamingGroupTitle: null,
      })
    } else if (intent.type === 'toggle-sidebar') {
      const expanded = !(
        state.sidebarExpanded ??
        resources.preferences.getSnapshot().tabManagerCompactLayout === 'list'
      )
      if (resources.host?.onSidebarExpandedChange) {
        view.setState({ sidebarExpanded: null })
        const operation = generation
        return Promise.resolve()
          .then(() => resources.host?.onSidebarExpandedChange?.(expanded))
          .catch((error) => {
            if (operation === generation)
              setNotice({
                message:
                  error instanceof Error
                    ? error.message
                    : 'Could not save sidebar layout.',
                kind: 'error',
              })
          })
      }
      view.setState({ sidebarExpanded: expanded })
    } else if (intent.type === 'scroll') {
      if (state.scrollTop !== intent.top)
        view.setState({ scrollTop: intent.top })
    } else if (intent.type === 'focus-item') {
      if (itemExists(snapshot, intent.item))
        view.setState({ focusedItem: intent.item })
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
      if (intent.alt) {
        const item = state.focusedItem
        if (item && (intent.key === 'ArrowUp' || intent.key === 'ArrowDown')) {
          if (item.type === 'tab')
            return execute(
              {
                type: 'move-tab',
                tabId: item.id,
                direction: intent.key === 'ArrowUp' ? 'backward' : 'forward',
              },
              'Move tab',
            )
          if (item.type === 'group')
            return execute(
              {
                type: 'group-action',
                groupIds: [item.id],
                action: {
                  type:
                    intent.key === 'ArrowUp' ? 'move-backward' : 'move-forward',
                },
              },
              'Move group',
            )
        }
        return
      }
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
        return closeItem(item)
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
        view.setState({ actionMenu: null, actionPanel: null })
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
      return execute(
        {
          type: 'create-window',
          sourceWindowId:
            resources.host?.getCurrentWindowId?.() ??
            state.viewedWindowId ??
            undefined,
        },
        'Create window',
      )
    } else if (intent.type === 'close-item') {
      return closeItem(intent.item)
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
        if (target.type === 'window') {
          view.setState({
            selection: reduceSelectionIntent(state.selection, {
              type: 'window-context-menu',
              windowId: target.id,
            }),
            viewedWindowId: target.id,
            focusedItem: target,
          })
          view.setState({ actionMenu: { target }, actionPanel: null })
          return
        }
        const represented = isSelectionItemRepresented(
          target,
          state.selection.selection,
          snapshot,
        )
        if (!represented) {
          dispatch({ type: 'select-item', item: target })
        }
      }
      view.setState({
        actionMenu: { target: intent.target },
        actionPanel: null,
      })
    } else if (intent.type === 'dismiss-action-menu') {
      view.setState({ actionMenu: null, actionPanel: null })
    } else if (intent.type === 'dismiss-notice') {
      notifications.dismiss(intent.id)
    } else if (intent.type === 'expand-notifications') {
      notifications.expand(intent.expanded)
    }
  }
  const clearSelection = () => {
    view.setState({
      selection: {
        selection: { ...createEmptySelectionSnapshot(), mode: 'default' },
        interaction: createSelectionInteractionState(),
      },
      actionMenu: null,
      actionPanel: null,
    })
  }
  return {
    dispatch,
    reconcile,
    notify: notifications.publish,
    startNotifications: notifications.start,
    cancel: () => {
      generation++
      notifications.dispose()
    },
    clearSelection,
  }
}

export type TabManagerController = ReturnType<typeof createTabManagerController>
