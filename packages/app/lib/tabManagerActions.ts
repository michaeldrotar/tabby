import {
  formatBatchTabCopyText,
  getGroupActionBlockReason,
  getMoveBlockReason,
  getNewWindowMoveBlockReason,
  getSingleGroupRenameState,
  getTabDiscardSelectionCounts,
  resolveSelectedTabIds,
} from '@extension/core'
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
  identificationMode?: 'active' | 'first'
  compactLayout?: 'icon' | 'list'
  reduceAgePrecision?: boolean
  isMac?: boolean
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
  const ids = resolveSelectedTabIds(selection, snapshot)
  const tabsById = new Map(snapshot.tabs.map((tab) => [tab.id, tab]))
  const tabs = ids.flatMap((id) => {
    const tab = tabsById.get(id)
    return tab ? [tab] : []
  })
  const groupIds = new Set(selection.groupIds)
  for (const group of snapshot.groups)
    if (selection.windowIds.has(group.windowId)) groupIds.add(group.id)
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
  if (ids.length === 0 && groupIds.size === 0 && selection.windowIds.size === 0)
    return { actions, operations }
  command(
    'close-selected-tabs',
    `Close ${count(ids.length)}`,
    'Trash2',
    { type: 'close-tabs', tabIds: ids },
    'primary',
    ids.length ? undefined : 'The selection contains no tabs.',
    true,
  )
  const newWindowReason = getNewWindowMoveBlockReason(ids, snapshot)
  const moveOptions = [
    option(
      'move-selected-tabs',
      'new',
      `${t('tabContextMenu_newWindow')} · ${ids.length}`,
      {
        type: 'command',
        command: { type: 'move-tabs', tabIds: ids },
        label: 'Move tabs',
      },
      {
        icon: 'ExternalLink',
        disabled: Boolean(newWindowReason),
        disabledReason: newWindowReason,
      },
    ),
    ...snapshot.windows.map((window) => {
      const windowTabs = snapshot.tabs
        .filter((tab) => tab.windowId === window.id)
        .sort((a, b) => a.index - b.index)
      const active =
        options.identificationMode === 'first'
          ? windowTabs[0]
          : (windowTabs.find((tab) => tab.active) ?? windowTabs[0])
      const reason = ids.every(
        (id) => tabs.find((tab) => tab.id === id)?.windowId === window.id,
      )
        ? 'All selected tabs are already in this window.'
        : getMoveBlockReason(ids, snapshot, window.id)
      return option(
        'move-selected-tabs',
        String(window.id),
        `${active?.title || (window.incognito ? (options.isMac ? 'Private window' : 'Incognito window') : `Window ${window.id}`)} · ${ids.length}`,
        {
          type: 'command',
          command: { type: 'move-tabs', tabIds: ids, windowId: window.id },
          label: 'Move tabs',
        },
        {
          iconUrl: active?.faviconUrl,
          dividerBefore: window.id === snapshot.windows[0]?.id,
          disabled: Boolean(reason),
          disabledReason: reason,
        },
      )
    }),
  ]
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
  add({
    id: 'group-selected-tabs',
    label: `Group ${count(ids.length)}`,
    icon: 'FolderPlus',
    kind: 'primary',
    panel: 'groups',
    disabled: Boolean(groupReason),
    disabledReason: groupReason,
    options: [
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
          disabled: Boolean(groupReason),
          disabledReason: groupReason,
        },
      ),
      ...snapshot.groups
        .filter((group) => !groupIds.has(group.id))
        .map((group) =>
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
              dividerBefore:
                group.id ===
                snapshot.groups.filter((group) => !groupIds.has(group.id))[0]
                  ?.id,
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
    ],
  })
  if (ids.length) {
    const pinned = tabs.every((tab) => tab.pinned),
      muted = tabs.every((tab) => tab.muted)
    for (const action of [
      pinned ? 'unpin' : 'pin',
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
  const rename = getSingleGroupRenameState({ ...selection, groupIds })
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
  const single =
    ids.length === 1 && !groupIds.size && !selection.windowIds.size
      ? tabs[0]
      : undefined
  if (single) {
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
    for (const direction of ['backward', 'forward'] as const)
      command(
        `move-tab-${direction}`,
        direction === 'backward' ? 'Move up' : 'Move down',
        direction === 'backward' ? 'ArrowUp' : 'ArrowDown',
        { type: 'move-tab', tabId: single.id, direction },
        'secondary',
      )
  }
  if (
    selection.groupIds.size === 1 &&
    !selection.tabIds.size &&
    !selection.windowIds.size
  ) {
    const groupId = [...selection.groupIds][0]!
    for (const direction of ['backward', 'forward'] as const)
      command(
        `move-group-${direction}`,
        direction === 'backward' ? 'Move group up' : 'Move group down',
        direction === 'backward' ? 'ArrowUp' : 'ArrowDown',
        {
          type: 'group-action',
          groupIds: [groupId],
          action: { type: `move-${direction}` },
        },
        'secondary',
      )
    command(
      'move-group-new-window',
      'Move group to new window',
      'MonitorUp',
      { type: 'move-group', groupId },
      'secondary',
    )
  }
  if (
    selection.windowIds.size &&
    !selection.groupIds.size &&
    !selection.tabIds.size
  ) {
    const windowIds = [...selection.windowIds]
    if (windowIds.length === 1)
      add(
        {
          id: 'focus-selected-window',
          label: 'Focus window',
          icon: 'Focus',
          kind: 'secondary',
        },
        {
          type: 'command',
          command: { type: 'activate-window', windowId: windowIds[0]! },
          label: 'Focus window',
        },
      )
    add(
      {
        id: 'close-selected-windows',
        label:
          windowIds.length === 1
            ? 'Close window'
            : `Close ${windowIds.length} windows`,
        icon: 'Trash2',
        kind: 'secondary',
        destructive: true,
      },
      {
        type: 'command',
        command: { type: 'window-action', windowIds, action: 'close' },
        label:
          windowIds.length === 1
            ? 'Close window'
            : `Close ${windowIds.length} windows`,
      },
    )
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
    'move-group-new-window': t('groupContextMenu_moveToNewWindow'),
    'focus-selected-window': t('windowContextMenu_focusWindow'),
    'close-selected-windows':
      selection.windowIds.size === 1
        ? t('windowContextMenu_closeWindow')
        : t('batch_closeWindows', String(selection.windowIds.size)),
  }
  for (const action of actions)
    if (labels[action.id]) action.label = labels[action.id]!
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
  const key = `${options.identificationMode ?? 'active'}:${Boolean(options.isMac)}`
  const cached = variants.get(key)
  if (cached) return cached
  const catalog = buildTabManagerActions(snapshot, state, options)
  variants.set(key, catalog)
  return catalog
}
