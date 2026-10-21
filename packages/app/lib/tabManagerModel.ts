import { getDuplicateTabIds, getMovedTabIds } from '@extension/core'
import {
  isSelectionItemRepresented,
  resolveSelectedTabIds,
  resolveSelectionItemTabIds,
} from '@extension/core/actions/batchTabActions'
import { createAsyncQueue } from '@extension/core/asyncQueue'
import { BROWSER_TAB_GROUP_COLORS } from '@extension/core/browser'
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
import { getWindowIdentity, WINDOW_ICONS } from '@extension/core/windowIdentity'
import { tt } from '@extension/i18n/catalog'
import { createNotificationController } from './notifications'
import { getTabManagerActions } from './tabManagerActions'
import { createDefaultTabSelection } from './view'
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
  previousSnapshot?: BrowserSnapshot,
): TabManagerViewState => {
  if (snapshot.state !== 'loaded') return state
  const windowIds = new Set(snapshot.windows.map((window) => window.id))
  const selectedWindow = windowIds.has(state.viewedWindowId ?? -1)
    ? state.viewedWindowId
    : (snapshot.windows.find((window) => window.focused)?.id ??
      snapshot.windows[0]?.id ??
      null)
  const groupIds = new Set(
    snapshot.groups
      .filter((group) => group.windowId === selectedWindow)
      .map((group) => group.id),
  )
  const tabIds = new Set(
    snapshot.tabs
      .filter((tab) => tab.windowId === selectedWindow)
      .map((tab) => tab.id),
  )
  const previous = state.selection.selection
  const filter = (ids: Set<number>, valid: Set<number>) =>
    new Set([...ids].filter((id) => valid.has(id)))
  const selection = {
    ...previous,
    groupIds: filter(previous.groupIds, groupIds),
    tabIds: filter(previous.tabIds, tabIds),
  }
  const defaultSelection =
    !selection.groupIds.size &&
    !selection.tabIds.size &&
    (!state.selectionCleared || selectedWindow !== state.viewedWindowId)
      ? createDefaultTabSelection(snapshot, selectedWindow)
      : null
  if (defaultSelection) Object.assign(selection, defaultSelection.selection)
  const selectionChanged = (['groupIds', 'tabIds'] as const).some(
    (key) =>
      selection[key].size !== previous[key].size ||
      [...selection[key]].some((id) => !previous[key].has(id)),
  )
  const order = getTabManagerOrder(snapshot, selectedWindow)
  const removedFocus =
    state.focusedItem &&
    (state.focusedItem.type === 'window'
      ? !windowIds.has(state.focusedItem.id)
      : !order.some((item) => sameItem(item, state.focusedItem)))
  const activeTab = removedFocus
    ? snapshot.tabs.find((tab) => tab.windowId === selectedWindow && tab.active)
    : undefined
  const removedTab =
    state.focusedItem?.type === 'tab' &&
    !snapshot.tabs.some((tab) => tab.id === state.focusedItem?.id)
      ? previousSnapshot?.tabs.find((tab) => tab.id === state.focusedItem?.id)
      : undefined
  let replacementTab = activeTab
  if (
    removedTab &&
    !removedTab.active &&
    removedTab.windowId === selectedWindow
  ) {
    const remaining = previousSnapshot!.tabs
      .filter((tab) => tab.windowId === selectedWindow && tabIds.has(tab.id))
      .toSorted((a, b) => a.index - b.index)
    const groupTabs =
      removedTab.groupId === undefined
        ? []
        : remaining.filter((tab) => tab.groupId === removedTab.groupId)
    const candidates = groupTabs.length ? groupTabs : remaining
    replacementTab =
      candidates.find((tab) => tab.index > removedTab.index) ??
      candidates.at(-1)
  }
  const replacementItem = replacementTab
    ? (order.find(
        (item) => item.type === 'tab' && item.id === replacementTab.id,
      ) ??
      order.find(
        (item) => item.type === 'group' && item.id === replacementTab.groupId,
      ))
    : undefined
  const focusedItem = removedFocus
    ? (replacementItem ?? order[0] ?? null)
    : state.focusedItem
  const anchor = state.selection.interaction.anchorItem
  const invalidAnchor = anchor && !itemExists(snapshot, anchor)
  const base = state.selection.interaction.baseSelection
  const invalidBase =
    base &&
    (base.tabIds.size !== filter(base.tabIds, tabIds).size ||
      base.groupIds.size !== filter(base.groupIds, groupIds).size)
  const menuTarget = state.actionMenu?.target
  const invalidMenu =
    menuTarget &&
    (menuTarget.type === 'window'
      ? menuTarget.id !== selectedWindow
      : !(menuTarget.type === 'tab' ? tabIds : groupIds).has(menuTarget.id))
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
    selectionCleared:
      selectedWindow === state.viewedWindowId && state.selectionCleared,
    scrollTop: selectedWindow === state.viewedWindowId ? state.scrollTop : 0,
    focusedItem,
    actionMenu: invalidMenu ? null : state.actionMenu,
    actionPanel: invalidMenu ? null : state.actionPanel,
    renamingGroupId: groupIds.has(state.renamingGroupId ?? -1)
      ? state.renamingGroupId
      : null,
    renamingGroupTitle: groupIds.has(state.renamingGroupId ?? -1)
      ? state.renamingGroupTitle
      : null,
    editingWindow: windowIds.has(state.editingWindow?.windowId ?? -1)
      ? state.editingWindow
      : null,
    selection: {
      selection,
      interaction: defaultSelection
        ? defaultSelection.interaction
        : invalidAnchor || invalidBase
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
export const projectTabManagerWindows = (
  snapshot: BrowserSnapshot,
  now: number,
  minutePrecision = false,
  windowSource: 'active' | 'first' = 'active',
) => {
  const ageLabels = snapshot.tabs.map((tab) =>
    formatTimeAgo(tab.lastAccessed, now, minutePrecision),
  )
  const clockKey = windowSource + ageLabels.join('|')
  const cached = projectedWindows.get(snapshot)
  if (cached?.clockKey === clockKey) return cached
  const ageLabelsById = new Map(
    snapshot.tabs.map((tab, index) => [tab.id, ageLabels[index]]),
  )
  const tabsByWindow = new Map<number, BrowserSnapshot['tabs'][number][]>()
  const groupsByWindow = new Map<number, BrowserSnapshot['groups'][number][]>()
  for (const tab of snapshot.tabs) {
    const list = tabsByWindow.get(tab.windowId) ?? []
    list.push(tab)
    tabsByWindow.set(tab.windowId, list)
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
    const splitNumbers = new Map<number, number>()
    for (const tab of tabs) {
      if (tab.splitViewId !== undefined && !splitNumbers.has(tab.splitViewId))
        splitNumbers.set(tab.splitViewId, splitNumbers.size + 1)
    }
    return {
      id: window.id,
      ...getWindowIdentity(window, tabs, windowSource),
      name: window.name,
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
        splitViewId: tab.splitViewId,
        splitViewNumber:
          tab.splitViewId === undefined
            ? undefined
            : splitNumbers.get(tab.splitViewId),
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
    duplicateTabIds: getDuplicateTabIds(snapshot.tabs),
  }
  projectedWindows.set(snapshot, value)
  return value
}
export const projectTabManager = (
  snapshot: BrowserSnapshot,
  state: TabManagerViewState,
  now: number,
  options: ManagerActionOptions = {},
  previousSnapshot?: BrowserSnapshot,
): TabManagerViewModel => {
  const current = reconcileTabManagerView(snapshot, state, previousSnapshot)
  const data = projectTabManagerWindows(
    snapshot,
    now,
    options.reduceAgePrecision,
    options.windowSource,
  )
  const catalog = getTabManagerActions(snapshot, current, options)
  const selectedGroupIds = [...current.selection.selection.groupIds]
  return {
    status:
      snapshot.state === 'loaded'
        ? 'ready'
        : snapshot.state === 'error'
          ? 'error'
          : 'loading',
    error: snapshot.error,
    windowSource: options.windowSource ?? 'active',
    windows: current.editingWindow
      ? data.windows.map((window) => {
          const draft = current.editingWindow!
          if (window.id !== draft.windowId) return window
          const custom = draft.useCustom !== false
          return {
            ...window,
            ...getWindowIdentity(
              {
                id: window.id,
                incognito: window.incognito,
                name: custom ? draft.name : undefined,
                icon: custom ? draft.icon : undefined,
                iconColor: custom ? draft.iconColor : undefined,
              },
              snapshot.tabs,
              options.windowSource,
            ),
            name: custom ? draft.name : undefined,
          }
        })
      : data.windows,
    duplicateTabIds: data.duplicateTabIds,
    actions: catalog.actions,
    contextActions: catalog.actions,
    windowPicker: current.windowPicker,
    editingWindow: current.editingWindow,
    actionPanel: current.actionPanel,
    renamingGroupId: current.renamingGroupId,
    renamingGroupTitle: current.renamingGroupTitle,
    scrollToItem: current.scrollToItem,
    viewedWindowId: current.viewedWindowId,
    selectedTabIds: resolveSelectedTabIds(
      current.selection.selection,
      snapshot,
    ),
    selectedGroupIds,
    selectionMode: current.selection.selection.mode,
    focusedItem: current.focusedItem,
    hoveredItem: current.hoveredItem,
    actionMenu: current.actionMenu,
    notifications: current.notifications,
    scrollTop: current.scrollTop,
  }
}

const describeOutcome = (
  outcome: CommandOutcome,
  action: string,
  command?: Parameters<TabManagerResources['backend']['execute']>[0],
): string | undefined => {
  const skippedActive = outcome.skippedActiveIds?.length ?? 0
  const alreadyDiscarded = outcome.skippedAlreadyDiscardedIds?.length ?? 0
  const isDiscard =
    command?.type === 'tab-action' && command.action === 'discard'
  if (
    isDiscard &&
    (skippedActive > 0 || alreadyDiscarded > 0 || outcome.failures.length > 0)
  ) {
    return [
      outcome.succeededIds.length
        ? tt('toast_nTabsDiscarded', outcome.succeededIds.length)
        : undefined,
      skippedActive
        ? tt('toast_nTabsActiveDiscardSkipped', skippedActive)
        : undefined,
      alreadyDiscarded
        ? tt('toast_nTabsAlreadyDiscarded', alreadyDiscarded)
        : undefined,
      outcome.failures.length
        ? tt('toast_nTabsDiscardFailed', outcome.failures.length)
        : undefined,
      outcome.status === 'failed' ? outcome.failures[0]?.message : undefined,
    ]
      .filter(Boolean)
      .join('; ')
  }
  if (outcome.status === 'success') return undefined
  if (outcome.status === 'ignored') return `${action} ignored; data unchanged.`
  if (outcome.status === 'failed') {
    return outcome.failures[0]?.message ?? `${action} could not be completed.`
  }
  if (outcome.status === 'partial') {
    return `${outcome.succeededIds.length} succeeded; ${outcome.failures.length} failed.`
  }
  return undefined
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
      windowSource:
        resources.preferences.getSnapshot().tabManagerCompactIconMode,
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
    }
    const next = reconcileTabManagerView(snapshot, current, previousSnapshot)
    previousSnapshot = snapshot
    if (next !== current) view.setState(next, true)
  }
  let inputRevision = 0
  const execute = async (
    command: Parameters<typeof backend.execute>[0],
    label: string,
  ) => {
    const operation = ++generation
    const initiatingState = view.getState()
    const initiatingSnapshot = backend.getSnapshot()
    const initiatingInput = inputRevision
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
    const sameInteraction =
      view.getState().viewedWindowId === initiatingState.viewedWindowId &&
      view.getState().selection.interaction ===
        initiatingState.selection.interaction
    if (command.type === 'create-tab' && sameInteraction) {
      const id = outcome.createdTabIds?.[0]
      const tab = backend.getSnapshot().tabs.find((tab) => tab.id === id)
      if (tab) {
        const state = view.getState()
        const item = { type: 'tab' as const, id: tab.id }
        view.setState({
          viewedWindowId: tab.windowId,
          selectionCleared: false,
          focusedItem: item,
          selection: reduceSelectionIntent(
            state.selection,
            {
              type: 'arrow',
              item,
              pane: 'tab',
              forceSingleSelect: true,
            },
            backend.getSnapshot(),
          ),
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
      outcome.status !== 'failed' &&
      view.getState().renamingGroupId === initiatingState.renamingGroupId &&
      view.getState().renamingGroupTitle === initiatingState.renamingGroupTitle
    ) {
      view.setState({ renamingGroupId: null, renamingGroupTitle: null })
    }
    const created = outcome.createdWindowIds?.[0]
    if (
      created !== undefined &&
      command.type === 'create-window' &&
      sameInteraction &&
      resources.host?.getCurrentWindowId?.() === undefined
    ) {
      const item = getTabManagerOrder(backend.getSnapshot(), created)[0] ?? null
      view.setState({
        viewedWindowId: created,
        selectionCleared: false,
        scrollTop: 0,
        ...(command.type === 'create-window'
          ? {
              focusedItem: item,
              selection: {
                selection: {
                  ...createEmptySelectionSnapshot(),
                  mode: 'default',
                },
                interaction: createSelectionInteractionState(),
              },
              windowPicker: false,
            }
          : {}),
      })
    }
    const isMove =
      command.type === 'move-tabs' ||
      command.type === 'move-group' ||
      command.type === 'place-tabs'
    const movedTabIds = getMovedTabIds(command, initiatingSnapshot, outcome)
    const movedTabs = movedTabIds.flatMap((id) => {
      const tab = backend.getSnapshot().tabs.find((tab) => tab.id === id)
      return tab ? [tab] : []
    })
    const destinationWindow = movedTabs[0]?.windowId
    const followsMove =
      isMove &&
      outcome.status === 'success' &&
      initiatingInput === inputRevision &&
      destinationWindow !== undefined &&
      movedTabs.some(
        (tab) =>
          initiatingSnapshot.tabs.find((source) => source.id === tab.id)
            ?.windowId !== tab.windowId,
      )
    if (
      isMove &&
      outcome.status === 'success' &&
      initiatingInput === inputRevision
    ) {
      const groupsToReveal = followsMove
        ? movedTabs.map((tab) => tab.groupId)
        : command.type === 'place-tabs'
          ? [command.destination.groupId]
          : []
      for (const groupId of new Set(groupsToReveal)) {
        if (
          groupId !== undefined &&
          backend.getSnapshot().groups.find((group) => group.id === groupId)
            ?.collapsed
        )
          await backend.execute({
            type: 'set-group-collapsed',
            groupId,
            collapsed: false,
          })
      }
      if (operation !== generation || initiatingInput !== inputRevision) return
    }
    const openWindowId = followsMove
      ? destinationWindow
      : command.type === 'activate-window' &&
          outcome.succeededIds.includes(command.windowId)
        ? command.windowId
        : command.type === 'create-window' && applied
          ? created
          : undefined
    if (
      isMove &&
      !followsMove &&
      applied &&
      initiatingInput === inputRevision &&
      movedTabIds.length
    ) {
      const local = movedTabs.filter(
        (tab) => tab.windowId === view.getState().viewedWindowId,
      )
      if (local.length)
        selectMovedTabs(
          local.map((tab) => tab.id),
          command.type !== 'place-tabs',
        )
    }
    if (openWindowId !== undefined) {
      if (
        sameInteraction &&
        command.type === 'activate-window' &&
        (resources.host?.getCurrentWindowId?.() === undefined ||
          resources.host.getCurrentWindowId() === openWindowId)
      )
        dispatch({ type: 'view-window', windowId: openWindowId })
      if (followsMove) {
        if (resources.host?.getCurrentWindowId?.() === undefined) {
          dispatch({ type: 'view-window', windowId: openWindowId })
          selectMovedTabs(movedTabIds)
        }
      }
      const beforeHost = view.getState()
      try {
        const opening = resources.host?.openWindowTabManager?.(
          openWindowId,
          ...(followsMove ? [movedTabIds] : []),
        )
        await Promise.all([
          opening,
          followsMove && movedTabs[0]
            ? backend.execute({ type: 'activate-tab', tabId: movedTabs[0].id })
            : undefined,
        ])
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
      if (
        view.getState().viewedWindowId === openWindowId &&
        view.getState().selection.interaction ===
          beforeHost.selection.interaction
      )
        view.setState({
          ...(active
            ? {
                scrollToItem: {
                  id: active.id,
                  revision: (view.getState().scrollToItem?.revision ?? 0) + 1,
                  ...(followsMove ? { focus: true } : {}),
                },
              }
            : {}),
        })
    }
    const message = describeOutcome(outcome, label, command)
    if (message)
      setNotice({
        message,
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
    const state = view.getState()
    const record =
      item.type === 'tab'
        ? snapshot.tabs.find((tab) => tab.id === item.id)
        : snapshot.groups.find((group) => group.id === item.id)
    if (record?.windowId !== state.viewedWindowId) return
    const selection = state.selection.selection
    const ids = isSelectionItemRepresented(item, selection, snapshot)
      ? resolveSelectedTabIds(selection, snapshot)
      : resolveSelectionItemTabIds(item, snapshot)
    if (ids.length)
      return execute({ type: 'close-tabs', tabIds: ids }, 'Close tabs')
  }
  const runHostAction = async (
    action: () => void | Promise<void>,
    fallback: string,
  ) => {
    const operation = generation
    try {
      await action()
    } catch (error) {
      if (operation === generation)
        setNotice({
          message: error instanceof Error ? error.message : fallback,
          kind: 'error',
        })
    }
  }
  const identityWrites = createAsyncQueue()
  const persistWindow = (
    draft: NonNullable<TabManagerViewState['editingWindow']>,
    onSaved?: () => void,
  ) =>
    identityWrites.run(async () => {
      try {
        const result = await backend.execute({
          type: 'name-window',
          windowId: draft.windowId,
          name: draft.useCustom === false ? '' : draft.name,
          icon: draft.useCustom === false ? undefined : draft.icon,
          iconColor: draft.useCustom === false ? undefined : draft.iconColor,
        })
        if (result.status === 'failed' || result.status === 'partial') {
          setNotice({
            message: result.failures[0]?.message ?? 'Could not save window.',
            kind: 'error',
          })
          return
        }
        onSaved?.()
      } catch (error) {
        setNotice({
          message:
            error instanceof Error ? error.message : 'Could not save window.',
          kind: 'error',
        })
      }
    })
  const selectMovedTabs = (tabIds: readonly number[], reveal = true) => {
    const snapshot = backend.getSnapshot()
    const ids = tabIds.filter((id) =>
      snapshot.tabs.some(
        (tab) =>
          tab.id === id && tab.windowId === view.getState().viewedWindowId,
      ),
    )
    if (!ids.length) return
    const groupId = snapshot.tabs.find((tab) => tab.id === ids[0])?.groupId
    const collapsedGroup = snapshot.groups.find(
      (group) => group.id === groupId && group.collapsed,
    )
    view.setState({
      selection: {
        selection: {
          ...createEmptySelectionSnapshot(),
          mode: ids.length > 1 ? 'multi-select' : 'default',
          tabIds: new Set(ids),
        },
        interaction: createSelectionInteractionState(),
      },
      selectionCleared: false,
      focusedItem:
        !reveal && collapsedGroup
          ? { type: 'group', id: collapsedGroup.id }
          : { type: 'tab', id: ids[0]! },
      scrollToItem: reveal
        ? {
            id: ids[0]!,
            revision: (view.getState().scrollToItem?.revision ?? 0) + 1,
            focus: true,
          }
        : null,
    })
  }
  const dispatch = (intent: TabManagerIntent): void | Promise<void> => {
    if (
      ![
        'scroll',
        'focus-item',
        'expand-notifications',
        'dismiss-notice',
      ].includes(intent.type)
    )
      inputRevision++
    reconcile()
    const snapshot = backend.getSnapshot()
    if (intent.type !== 'view-window' && !view.getState().hasUserInput)
      view.setState({ hasUserInput: true })
    const state = view.getState()
    if (intent.type === 'receive-moved-tabs') {
      dispatch({ type: 'view-window', windowId: intent.windowId })
      selectMovedTabs(intent.tabIds)
    } else if (intent.type === 'place-tabs') {
      if (
        intent.destination?.windowId === state.viewedWindowId &&
        intent.scrollTop !== undefined
      )
        view.setState({ scrollTop: intent.scrollTop, scrollToItem: null })
      return execute(
        intent.destination
          ? {
              type: 'place-tabs',
              tabIds: intent.tabIds,
              destination: intent.destination,
            }
          : {
              type: 'move-tabs',
              tabIds: intent.tabIds,
              windowId: intent.windowId,
            },
        'Move tabs',
      )
    } else if (intent.type === 'open-window-picker') {
      view.setState({
        windowPicker: true,
        editingWindow: null,
        actionMenu: null,
        actionPanel: null,
      })
    } else if (intent.type === 'dismiss-window-picker') {
      view.setState({ windowPicker: false, actionPanel: null })
    } else if (intent.type === 'edit-window') {
      if (state.editingWindow) return dispatch({ type: 'save-window' })
      const window = snapshot.windows.find(
        (window) => window.id === state.viewedWindowId,
      )
      if (!window) return
      const random = resources.environment.random ?? Math.random
      const name = getWindowIdentity(
        { ...window, name: undefined, icon: undefined },
        snapshot.tabs,
        resources.preferences.getSnapshot().tabManagerCompactIconMode,
      ).title
      const draft = {
        windowId: window.id,
        useCustom: true,
        name: window.name || name,
        icon:
          window.icon ??
          WINDOW_ICONS[Math.floor(random() * WINDOW_ICONS.length)]!,
        iconColor:
          window.iconColor ??
          BROWSER_TAB_GROUP_COLORS[
            Math.floor(random() * BROWSER_TAB_GROUP_COLORS.length)
          ]!,
      }
      view.setState({
        windowPicker: false,
        editingWindow: draft,
        actionMenu: null,
        actionPanel: null,
      })
      return persistWindow(draft)
    } else if (intent.type === 'change-window-draft') {
      if (!state.editingWindow) return
      const draft = { ...state.editingWindow, ...intent.value, useCustom: true }
      view.setState({ editingWindow: draft })
      return persistWindow(draft)
    } else if (intent.type === 'reset-window') {
      if (!state.editingWindow) return
      const draft = { ...state.editingWindow, useCustom: false }
      view.setState({ editingWindow: draft })
      return persistWindow(draft, () => {
        if (view.getState().editingWindow === draft)
          view.setState({ editingWindow: null })
      })
    } else if (
      intent.type === 'cancel-window-edit' ||
      intent.type === 'save-window'
    ) {
      view.setState({ editingWindow: null })
    } else if (intent.type === 'run-action') {
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
        view.setState({
          actionPanel: { actionId: intent.actionId },
        })
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
      const action =
        intent.type === 'open-search'
          ? resources.host?.openSearch
          : resources.host?.openOptions
      if (action)
        return runHostAction(action, 'Could not open the requested page.')
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
      if (!snapshot.windows.some((window) => window.id === intent.windowId))
        return
      if (state.viewedWindowId === intent.windowId) return
      view.setState({
        viewedWindowId: intent.windowId,
        editingWindow: null,
        windowPicker: false,
        focusedItem: getTabManagerOrder(snapshot, intent.windowId)[0] ?? null,
        selection: createDefaultTabSelection(snapshot, intent.windowId),
        selectionCleared: false,
        scrollTop: 0,
        actionMenu: null,
        actionPanel: null,
        renamingGroupId: null,
        renamingGroupTitle: null,
      })
    } else if (intent.type === 'scroll') {
      if (state.scrollTop !== intent.top)
        view.setState({ scrollTop: intent.top })
    } else if (intent.type === 'focus-creation') {
      view.setState({
        focusedItem: null,
        ...(intent.pane === 'tab' &&
        state.selection.selection.mode === 'default' &&
        state.selection.selection.tabIds.size +
          state.selection.selection.groupIds.size <=
          1
          ? {
              selection: {
                selection: {
                  ...createEmptySelectionSnapshot(),
                  mode: 'default' as const,
                },
                interaction: createSelectionInteractionState(),
              },
              selectionCleared: true,
            }
          : {}),
      })
    } else if (intent.type === 'focus-item') {
      if (itemExists(snapshot, intent.item))
        view.setState({ focusedItem: intent.item })
    } else if (intent.type === 'select-item') {
      const item = intent.item
      if (
        item.type === 'window' ||
        !getTabManagerOrder(snapshot, state.viewedWindowId).some((candidate) =>
          sameItem(candidate, item),
        )
      )
        return
      const order = getTabManagerOrder(snapshot, state.viewedWindowId)
      const selection = reduceSelectionIntent(
        state.selection,
        {
          type: 'click',
          item,
          pane: 'tab',
          orderedItems: order,
          shift: intent.shift ?? false,
          toggle: intent.toggle ?? false,
        },
        snapshot,
      )
      const empty =
        !selection.selection.tabIds.size && !selection.selection.groupIds.size
      const explicitlyCleared = !!intent.toggle && item.type === 'tab' && empty
      view.setState({
        selection:
          empty && !explicitlyCleared
            ? createDefaultTabSelection(snapshot, state.viewedWindowId)
            : selection,
        selectionCleared: explicitlyCleared,
        focusedItem: item,
      })
    } else if (intent.type === 'navigate') {
      if (intent.key === 'Escape') {
        if (state.actionMenu || state.actionPanel)
          view.setState({ actionMenu: null, actionPanel: null })
        else if (state.windowPicker) view.setState({ windowPicker: false })
        else clearSelection()
        return
      }
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
        return dispatch({
          type: 'open-action-menu',
          target:
            state.focusedItem &&
            !isSelectionItemRepresented(
              state.focusedItem,
              state.selection.selection,
              snapshot,
            )
              ? state.focusedItem
              : undefined,
        })
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
      const pane: PaneContext = 'tab'
      if (intent.key === 'ArrowLeft' || intent.key === 'ArrowRight') {
        return
      }
      const order = getTabManagerOrder(snapshot, state.viewedWindowId)
      const index = order.findIndex((item) => sameItem(item, state.focusedItem))
      const delta = intent.key === 'ArrowUp' ? -1 : 1
      const item =
        intent.item ??
        (intent.key === 'Home'
          ? order[0]
          : intent.key === 'End'
            ? order.at(-1)
            : intent.key.startsWith('Arrow')
              ? order[Math.max(0, Math.min(order.length - 1, index + delta))]
              : (state.focusedItem ?? order[0]))
      if (!item) return
      if (intent.key === 'Delete' || intent.key === 'Backspace') {
        if (
          isSelectionItemRepresented(item, state.selection.selection, snapshot)
        )
          return dispatch({
            type: 'run-action',
            actionId: 'close-selected-tabs',
          })
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
      const modelIntent =
        intent.key === ' '
          ? { type: 'space' as const, item, pane }
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
      const selection = reduceSelectionIntent(
        state.selection,
        modelIntent,
        snapshot,
      )
      view.setState({
        selection:
          !selection.selection.tabIds.size && !selection.selection.groupIds.size
            ? createDefaultTabSelection(snapshot, state.viewedWindowId)
            : selection,
        selectionCleared: false,
        focusedItem: item,
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
        {
          type: 'close-tabs',
          tabIds: intent.tabIds.filter((id) =>
            snapshot.tabs.some(
              (tab) => tab.id === id && tab.windowId === state.viewedWindowId,
            ),
          ),
        },
        'Close tabs',
      )
    } else if (intent.type === 'close-window') {
      return execute(intent, 'Close window')
    } else if (intent.type === 'activate-tab') {
      dispatch({ type: 'select-item', item: { type: 'tab', id: intent.tabId } })
      return execute(intent, 'Activate tab')
    } else if (intent.type === 'activate-window') {
      view.setState({ windowPicker: false })
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
        if (target.type === 'window') return
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
      selection: createDefaultTabSelection(
        backend.getSnapshot(),
        view.getState().viewedWindowId,
      ),
      selectionCleared: false,
      actionMenu: null,
      actionPanel: null,
    })
  }
  return {
    dispatch,
    reconcile,
    getPreviousSnapshot: () => previousSnapshot,
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
