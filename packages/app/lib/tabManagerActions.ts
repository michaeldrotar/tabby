import {
  formatBatchTabCopyText,
  getGroupActionBlockReason,
  getMoveBlockReason,
  getNewWindowMoveBlockReason,
  getOtherTabIdsWithSameUrl,
  getSingleGroupRenameState,
  getTabDiscardSelectionCounts,
  getTabMoveUnits,
  resolveSelectedTabIds,
} from '@extension/core'
import { getWindowIdentity } from '@extension/core/windowIdentity'
import { t, tt } from '@extension/i18n/catalog'
import type { TabManagerViewState } from './view'
import type {
  BrowserCommand,
  BrowserSnapshot,
  BrowserTabGroupColor,
} from '@extension/core'
import type {
  TabManagerAction,
  TabManagerActionOption,
} from '@extension/ui/tab-manager/TabManager'

export type ManagerActionOperation =
  | { type: 'command'; command: BrowserCommand; label: string }
  | { type: 'copy'; text: string; label: string }
  | { type: 'rename'; groupId: number }

export type ManagerActionOptions = {
  windowSource?: 'active' | 'first'
  reduceAgePrecision?: boolean
}
export type ManagerActionCatalog = {
  actions: TabManagerAction[]
  operations: Map<string, ManagerActionOperation>
}
const colors: BrowserTabGroupColor[] = [
  'grey',
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
]
const count = (n: number) => tt('nTabs', n)

/** One catalog drives the action bar and its context menu. UI receives only serializable descriptors. */
const buildTabManagerActions = (
  snapshot: BrowserSnapshot,
  state: TabManagerViewState,
  options: ManagerActionOptions = {},
): ManagerActionCatalog => {
  const selection = state.selection.selection
  const ids = resolveSelectedTabIds(selection, snapshot).filter((id) =>
    snapshot.tabs.some(
      (tab) => tab.id === id && tab.windowId === state.viewedWindowId,
    ),
  )
  const tabsById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
  const tabs = ids.flatMap((id) => {
    const tab = tabsById.get(id)
    return tab ? [tab] : []
  })
  const groupIds = new Set(
    [...selection.groupIds].filter((id) =>
      snapshot.groups.some(
        (group) => group.id === id && group.windowId === state.viewedWindowId,
      ),
    ),
  )
  const groups = snapshot.groups.filter((group) => groupIds.has(group.id))
  const actions: TabManagerAction[] = [],
    operations = new Map<string, ManagerActionOperation>()
  const add = (
    action: TabManagerAction,
    operation?: ManagerActionOperation,
  ) => {
    actions.push(action)
    if (operation) operations.set(action.id, operation)
  }
  const command = (
    id: string,
    label: string,
    icon: string,
    value: BrowserCommand,
    kind: 'primary' | 'secondary' = 'primary',
    disabledReason?: string,
    destructive = false,
  ) =>
    add(
      {
        id,
        label,
        icon,
        kind,
        disabled: Boolean(disabledReason),
        disabledReason,
        destructive,
      },
      { type: 'command', command: value, label },
    )
  const option = (
    actionId: string,
    id: string,
    label: string,
    operation: ManagerActionOperation,
    extras: Partial<TabManagerActionOption> = {},
  ): TabManagerActionOption => {
    operations.set(`${actionId}:${id}`, operation)
    return { id, label, ...extras }
  }
  if (ids.length === 0 && groupIds.size === 0) return { actions, operations }
  command(
    'close-selected-tabs',
    `Close ${count(ids.length)}`,
    'Trash2',
    { type: 'close-tabs', tabIds: ids },
    'primary',
    ids.length ? undefined : 'The selection contains no tabs.',
    true,
  )
  const wholeGroup =
    tabs.length > 0 &&
    tabs[0]?.groupId !== undefined &&
    tabs.every((tab) => tab.groupId === tabs[0]!.groupId) &&
    snapshot.tabs.filter((tab) => tab.groupId === tabs[0]!.groupId).length ===
      tabs.length
      ? snapshot.groups.find((group) => group.id === tabs[0]!.groupId)
      : undefined
  const preservesGroups = getTabMoveUnits(ids, snapshot).some(
    (unit) => unit.groupId !== undefined,
  )
  const moveCommand = (windowId?: number): BrowserCommand =>
    wholeGroup
      ? { type: 'move-group', groupId: wholeGroup.id, windowId }
      : { type: 'move-tabs', tabIds: ids, windowId }
  const newWindowReason = getNewWindowMoveBlockReason(ids, snapshot)
  const onlyGroupInWindow =
    !!wholeGroup &&
    snapshot.tabs.filter((tab) => tab.windowId === state.viewedWindowId)
      .length === ids.length
  const moveOptions = snapshot.windows.map((window) => {
    const windowTabs = snapshot.tabs
      .filter((tab) => tab.windowId === window.id)
      .sort((a, b) => a.index - b.index)
    const identity = getWindowIdentity(window, windowTabs, options.windowSource)
    const reason = ids.every(
      (id) => tabs.find((tab) => tab.id === id)?.windowId === window.id,
    )
      ? 'All selected tabs are already in this window.'
      : getMoveBlockReason(ids, snapshot, window.id)
    return option(
      'move-selected-tabs',
      String(window.id),
      identity.title,
      {
        type: 'command',
        command: moveCommand(window.id),
        label: 'Move tabs',
      },
      {
        icon: identity.icon,
        iconUrl: identity.iconUrl,
        windowIconColor: identity.iconColor,
        subtitle: `${windowTabs.length} ${windowTabs.length === 1 ? 'tab' : 'tabs'}`,
        dividerBefore: window.id === snapshot.windows[0]?.id,
        disabled: Boolean(reason),
        disabledReason: reason,
      },
    )
  })
  if (!onlyGroupInWindow)
    moveOptions.push(
      option(
        'move-selected-tabs',
        'new',
        t('tabContextMenu_newWindow'),
        {
          type: 'command',
          command: moveCommand(),
          label: 'Move tabs',
        },
        {
          icon: 'Plus',
          dividerBefore: true,
          disabled: Boolean(newWindowReason),
          disabledReason: newWindowReason,
        },
      ),
    )
  const moveReason = moveOptions.every((option) => option.disabled)
    ? (newWindowReason ?? 'No available destination window.')
    : undefined
  add({
    id: 'move-selected-tabs',
    label: `Move ${count(ids.length)}`,
    icon: 'MonitorUp',
    kind: 'primary',
    panel: 'windows',
    options: moveOptions,
    disabled: Boolean(moveReason),
    disabledReason: moveReason,
  })
  const groupReason = getGroupActionBlockReason(ids, snapshot)
  if (!preservesGroups)
    add({
      id: 'group-selected-tabs',
      label: `Group ${count(ids.length)}`,
      icon: 'FolderPlus',
      kind: 'primary',
      panel: 'groups',
      disabled: Boolean(groupReason),
      disabledReason: groupReason,
      options: [
        ...snapshot.groups
          .filter((group) => !groupIds.has(group.id))
          .map((group, index) =>
            option(
              'group-selected-tabs',
              String(group.id),
              group.title || t('tabContextMenu_untitledGroup'),
              {
                type: 'command',
                command: { type: 'group-tabs', tabIds: ids, groupId: group.id },
                label: 'Group tabs',
              },
              {
                color: group.color,
                subtitle: String(ids.length),
                dividerBefore: index === 0,
                disabled:
                  Boolean(groupReason) || group.windowId !== tabs[0]?.windowId,
                disabledReason:
                  groupReason ??
                  (group.windowId !== tabs[0]?.windowId
                    ? 'Selected tabs must be in the target group’s window.'
                    : undefined),
              },
            ),
          ),
        option(
          'group-selected-tabs',
          'new',
          `${t('tabContextMenu_newGroup')} · ${ids.length}`,
          {
            type: 'command',
            command: { type: 'group-tabs', tabIds: ids },
            label: 'Group tabs',
          },
          {
            icon: 'Plus',
            dividerBefore: true,
            disabled: Boolean(groupReason),
            disabledReason: groupReason,
          },
        ),
      ],
    })
  if (ids.length) {
    const pinned = tabs.every((tab) => tab.pinned),
      muted = tabs.every((tab) => tab.muted)
    for (const action of [
      ...(!preservesGroups
        ? [pinned ? ('unpin' as const) : ('pin' as const)]
        : []),
      'duplicate',
      'reload',
    ] as const)
      command(
        `${action}-selected-tabs`,
        `${action[0]!.toUpperCase()}${action.slice(1)} ${count(ids.length)}`,
        action === 'pin'
          ? 'Pin'
          : action === 'unpin'
            ? 'PinOff'
            : action === 'duplicate'
              ? 'Layers'
              : 'RefreshCw',
        { type: 'tab-action', action, tabIds: ids },
      )
    const discard = getTabDiscardSelectionCounts(tabs)
    const reason = discard.discardableCount
      ? undefined
      : discard.activeCount && discard.alreadyDiscardedCount
        ? 'Active and already discarded tabs cannot be discarded.'
        : discard.activeCount
          ? 'Active tabs cannot be discarded.'
          : discard.alreadyDiscardedCount
            ? 'These tabs are already discarded.'
            : 'No eligible tabs are selected.'
    command(
      'discard-selected-tabs',
      discard.discardableCount
        ? `Discard ${count(discard.discardableCount)}`
        : 'Discard tabs',
      'MemoryStick',
      { type: 'tab-action', action: 'discard', tabIds: ids },
      'primary',
      reason,
    )
    if (tabs.some((tab) => tab.muted || tab.audible))
      command(
        `${muted ? 'unmute' : 'mute'}-selected-tabs`,
        `${muted ? 'Unmute' : 'Mute'} ${count(ids.length)}`,
        muted ? 'Volume2' : 'VolumeOff',
        { type: 'tab-action', action: muted ? 'unmute' : 'mute', tabIds: ids },
      )
  }
  const hasTabsOutsideGroups = tabs.some(
    (tab) => !groupIds.has(tab.groupId ?? -1),
  )
  const rename = getSingleGroupRenameState({
    ...selection,
    groupIds,
    tabIds: hasTabsOutsideGroups ? selection.tabIds : new Set(),
  })
  if (rename.visible)
    add(
      {
        id: 'rename-selected-group',
        label: 'Rename group',
        icon: 'Pencil',
        kind: 'secondary',
        disabled: !rename.enabled,
        disabledReason: rename.reason,
      },
      { type: 'rename', groupId: [...groupIds][0]! },
    )
  if (groups.length) {
    const collapsed = groups.some((group) => !group.collapsed)
    command(
      'toggle-selected-groups',
      collapsed ? 'Collapse group' : 'Expand group',
      collapsed ? 'ChevronUp' : 'ChevronDown',
      {
        type: 'group-action',
        groupIds: groups.map((group) => group.id),
        action: { type: 'set-collapse', collapsed },
      },
      'secondary',
    )
    add({
      id: 'change-selected-group-color',
      label: 'Change color',
      icon: 'Palette',
      kind: 'secondary',
      panel: 'colors',
      options: colors.map((color) =>
        option(
          'change-selected-group-color',
          color,
          t(`groupColor_${color}`),
          {
            type: 'command',
            command: {
              type: 'group-action',
              groupIds: groups.map((group) => group.id),
              action: { type: 'change-color', color },
            },
            label: 'Change group color',
          },
          { color },
        ),
      ),
    })
  }
  const grouped = groups.length
    ? snapshot.tabs.filter((tab) => groupIds.has(tab.groupId ?? -1))
    : tabs.filter((tab) => tab.groupId !== undefined)
  if (grouped.length)
    command(
      groups.length
        ? 'ungroup-selected-groups'
        : 'remove-selected-tabs-from-group',
      `${groups.length ? 'Ungroup' : 'Remove from group'} ${count(grouped.length)}`,
      'Ungroup',
      {
        type: 'tab-action',
        action: 'ungroup',
        tabIds: grouped.map((tab) => tab.id),
      },
      'secondary',
    )
  if (ids.length)
    add({
      id: 'copy-selected-tabs',
      label: `Copy ${count(ids.length)}`,
      icon: 'Copy',
      kind: 'secondary',
      panel: 'copy',
      options: (
        [
          ['urls', 'Copy URLs', 'Link2'],
          ['titles', 'Copy titles', 'FileText'],
          ['titles-and-urls', 'Copy titles and URLs', 'Copy'],
        ] as const
      ).map(([kind, label, icon]) =>
        option(
          'copy-selected-tabs',
          kind,
          label,
          { type: 'copy', text: formatBatchTabCopyText(tabs, kind), label },
          { icon },
        ),
      ),
    })
  const single = ids.length === 1 && !groupIds.size ? tabs[0] : undefined
  const duplicateTabIds = single
    ? getOtherTabIdsWithSameUrl(snapshot.tabs, single.id)
    : []
  if (single) {
    if (duplicateTabIds.length)
      command(
        'close-duplicate-tabs',
        tt('tabContextMenu_closeDuplicates', duplicateTabIds.length),
        'Trash2',
        {
          type: 'close-relative-tabs',
          tabId: single.id,
          direction: 'duplicates',
        },
        'secondary',
        undefined,
        true,
      )
    for (const direction of ['other', 'below'] as const) {
      const relatives = snapshot.tabs.filter(
        (tab) =>
          tab.windowId === single.windowId &&
          tab.id !== single.id &&
          !tab.pinned &&
          (direction === 'other' || tab.index > single.index),
      )
      if (relatives.length)
        command(
          direction === 'other' ? 'close-other-tabs' : 'close-tabs-below',
          direction === 'other' ? 'Close other tabs' : 'Close tabs below',
          direction === 'other' ? 'Trash2' : 'ArrowDown',
          { type: 'close-relative-tabs', tabId: single.id, direction },
          'secondary',
          undefined,
          true,
        )
    }
  }
  const counted = count(ids.length)
  const labels: Record<string, string> = {
    'close-selected-tabs': t('batch_closeTabs', counted),
    'move-selected-tabs': t('batch_moveTabs', counted),
    'group-selected-tabs': t('batch_groupTabs', counted),
    'pin-selected-tabs': t('batch_pinTabs', counted),
    'unpin-selected-tabs': t('batch_unpinTabs', counted),
    'duplicate-selected-tabs': t('batch_duplicateTabs', counted),
    'reload-selected-tabs': t('batch_reloadTabs', counted),
    'discard-selected-tabs': getTabDiscardSelectionCounts(tabs).discardableCount
      ? t(
          'batch_discardTabs',
          count(getTabDiscardSelectionCounts(tabs).discardableCount),
        )
      : t('batch_discardTabsNoCount'),
    'mute-selected-tabs': t('batch_muteTabs', counted),
    'unmute-selected-tabs': t('batch_unmuteTabs', counted),
    'rename-selected-group': t('groupContextMenu_renameGroup'),
    'toggle-selected-groups': t(
      groups.some((group) => !group.collapsed)
        ? 'groupContextMenu_collapseGroup'
        : 'groupContextMenu_expandGroup',
    ),
    'change-selected-group-color': t('groupContextMenu_changeColor'),
    'ungroup-selected-groups': t('batch_ungroupTabs', count(grouped.length)),
    'remove-selected-tabs-from-group': t(
      'batch_removeFromGroup',
      count(grouped.length),
    ),
    'copy-selected-tabs': t('batch_copyTabs', counted),
    'close-other-tabs': t('tabContextMenu_closeOtherTabs'),
    'close-tabs-below': t('tabContextMenu_closeTabsBelow'),
  }
  for (const action of actions)
    if (labels[action.id])
      action.label =
        wholeGroup && action.id === 'move-selected-tabs'
          ? 'Move tab group to window'
          : labels[action.id]!
  return { actions, operations }
}

const catalogCache = new WeakMap<
  BrowserSnapshot,
  WeakMap<
    TabManagerViewState['selection']['selection'],
    Map<string, ManagerActionCatalog>
  >
>()
export const getTabManagerActions = (
  snapshot: BrowserSnapshot,
  state: TabManagerViewState,
  options: ManagerActionOptions = {},
): ManagerActionCatalog => {
  let selections = catalogCache.get(snapshot)
  if (!selections) {
    selections = new WeakMap()
    catalogCache.set(snapshot, selections)
  }
  let variants = selections.get(state.selection.selection)
  if (!variants) {
    variants = new Map()
    selections.set(state.selection.selection, variants)
  }
  const key = `${state.viewedWindowId}:${options.windowSource ?? 'active'}`
  const cached = variants.get(key)
  if (cached) return cached
  const catalog = buildTabManagerActions(snapshot, state, options)
  variants.set(key, catalog)
  return catalog
}
