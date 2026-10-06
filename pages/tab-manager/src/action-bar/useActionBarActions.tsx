import { useBrowserTabGroups } from '@extension/chrome/tabGroup/useBrowserTabGroups'
import { usePlatformInfo } from '@extension/chrome/usePlatformInfo'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { t } from '@extension/i18n/i18n'
import { tt } from '@extension/i18n/plurals'
import {
  getGroupColorClasses,
  TAB_GROUP_COLOR_IDS,
} from '@extension/ui/tab-group/tabGroupColors'
import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Focus,
  FolderPlus,
  Layers,
  Link2,
  MonitorUp,
  Palette,
  Pencil,
  Pin,
  PinOff,
  RefreshCw,
  Trash2,
  Ungroup,
  Volume2,
  VolumeOff,
} from 'lucide-react'
import { useMemo } from 'react'
import { getSingleGroupRenameState } from '../actions/batchTabActions'
import { useBatchTabActions } from '../actions/useBatchTabActions'
import { useSelection } from '../selection/useSelection'
import { GroupTabsPanel } from './GroupTabsPanel'
import { MoveToWindowPanel } from './MoveToWindowPanel'
import type { ActionBarItem } from './types'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
} from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'
import type { ReactNode } from 'react'

type PanelAction = {
  label: string
  icon: ReactNode
  execute: () => void
  disabled?: boolean
  disabledReason?: string
  destructive?: boolean
}

export const useActionBarActions = (
  selectedWindowId: BrowserWindowID | undefined,
  onRenameGroup?: (groupId: number) => void,
) => {
  const selection = useSelection()
  const batch = useBatchTabActions()
  const windows = useBrowserWindows()
  const groups = useBrowserTabGroups()
  const { data: platformInfo } = usePlatformInfo()
  const isMac = platformInfo?.os === 'mac'

  const hasSelection = selection.totalCount > 0
  const selectedTabCount = batch.selectedTabIds.length
  const selectedWindowCount = selection.windowIds.size
  const selectedGroupIds = useMemo(() => {
    const ids = new Set(selection.groupIds)
    for (const group of groups) {
      if (selection.windowIds.has(group.windowId)) ids.add(group.id)
    }
    return ids
  }, [groups, selection.groupIds, selection.windowIds])
  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedGroupIds.has(group.id)),
    [groups, selectedGroupIds],
  )
  const selectedGroupCount = selectedGroupIds.size
  const countLabel = tt('nTabs', selectedTabCount)
  const selectedTabs = batch.selectedTabIds.flatMap((id) => {
    const tab = batch.snapshot.tabs.find((candidate) => candidate.id === id)
    return tab ? [tab] : []
  })
  const selectedWindows = windows.filter((window) =>
    selection.windowIds.has(window.id),
  )
  const selectedWindowIds = selectedWindows.map((window) => window.id)
  const selectedGroupTabIds = batch.snapshot.tabs
    .filter((tab) => selectedGroupIds.has(tab.groupId ?? -1))
    .map((tab) => tab.id)
  const ungroupTabIds = selectedTabs
    .filter((tab) => tab.groupId !== undefined && tab.groupId !== -1)
    .map((tab) => tab.id)
  const sourceWindowId = selectedTabs[0]?.windowId ?? selectedWindowId
  const renameState = getSingleGroupRenameState({
    ...batch.selection,
    groupIds: selectedGroupIds,
  })
  const moveTargets = windows.filter((window) => {
    const allAlreadyInWindow =
      selectedTabCount > 0 &&
      batch.selectedTabIds.every(
        (tabId) =>
          batch.snapshot.tabs.find((tab) => tab.id === tabId)?.windowId ===
          window.id,
      )
    return !allAlreadyInWindow && !batch.moveBlockReason(window.id)
  })
  const canMoveToNewWindow = !batch.moveNewWindowBlockReason
  const moveDisabledReason =
    moveTargets.length === 0 && !canMoveToNewWindow
      ? (batch.moveNewWindowBlockReason ?? 'No available destination window.')
      : undefined
  const groupDisabledReason = batch.groupBlockReason
  const isAllPinned =
    selectedTabs.length > 0 && selectedTabs.every((tab) => tab.pinned)
  const areAllMuted =
    selectedTabs.length > 0 && selectedTabs.every((tab) => tab.muted)
  const hasAudioState = selectedTabs.some((tab) => tab.muted || tab.audible)
  const isSingleTabTarget =
    selectedTabCount === 1 &&
    selectedGroupCount === 0 &&
    selection.windowIds.size === 0 &&
    selection.expandedWindowIds.size === 0
  const singleTargetTab = isSingleTabTarget ? selectedTabs[0] : undefined
  const collapseSelectedGroups = selectedGroups.some(
    (group) => !group.collapsed,
  )
  const windowExclusive =
    selection.windowIds.size > 0 &&
    selection.groupIds.size === 0 &&
    selection.tabIds.size === 0

  const actions = useMemo(() => {
    if (!hasSelection) return []

    const items: ActionBarItem[] = [
      {
        id: 'close-selected-tabs',
        icon: <Trash2 size={17} />,
        label: t('batch_closeTabs', countLabel),
        kind: 'primary',
        disabled: selectedTabCount === 0,
        disabledReason:
          selectedTabCount === 0
            ? 'The selection contains no tabs.'
            : undefined,
        execute: () => void batch.close(),
      },
      {
        id: 'move-selected-tabs',
        icon: <MonitorUp size={17} />,
        label: t('batch_moveTabs', countLabel),
        kind: 'primary',
        disabled: selectedTabCount === 0 || Boolean(moveDisabledReason),
        disabledReason:
          selectedTabCount === 0
            ? 'The selection contains no tabs.'
            : moveDisabledReason,
        execute: () => {},
        panel: ({ onClose }) => (
          <MoveToWindowPanel
            windows={windows}
            selectedTabIds={batch.selectedTabIds}
            isMac={isMac}
            newWindowDisabledReason={batch.moveNewWindowBlockReason}
            getWindowDisabledReason={(windowId) => {
              const allAlreadyInWindow = batch.selectedTabIds.every(
                (tabId) =>
                  batch.snapshot.tabs.find((tab) => tab.id === tabId)
                    ?.windowId === windowId,
              )
              return allAlreadyInWindow
                ? 'All selected tabs are already in this window.'
                : batch.moveBlockReason(windowId)
            }}
            onMoveToNewWindow={() =>
              void batch.moveToNewWindow().finally(onClose)
            }
            onMoveToWindow={(windowId) =>
              void batch.moveToWindow(windowId).finally(onClose)
            }
          />
        ),
      },
      {
        id: 'group-selected-tabs',
        icon: <FolderPlus size={17} />,
        label: t('batch_groupTabs', countLabel),
        kind: 'primary',
        disabled: selectedTabCount === 0 || Boolean(groupDisabledReason),
        disabledReason:
          selectedTabCount === 0
            ? 'The selection contains no tabs.'
            : groupDisabledReason,
        execute: () => {},
        panel: ({ onClose }) => (
          <GroupTabsPanel
            groups={groups}
            selectedTabIds={batch.selectedTabIds}
            selectedGroupIds={selectedGroupIds}
            sourceWindowId={sourceWindowId}
            disabledReason={groupDisabledReason}
            onCreateGroup={() =>
              sourceWindowId === undefined
                ? undefined
                : void batch.createGroup(sourceWindowId).finally(onClose)
            }
            onAddToGroup={(groupId) =>
              void batch.addToGroup(groupId).finally(onClose)
            }
          />
        ),
      },
    ]

    if (selectedTabCount > 0) {
      items.push(
        {
          id: isAllPinned ? 'unpin-selected-tabs' : 'pin-selected-tabs',
          icon: isAllPinned ? <PinOff size={17} /> : <Pin size={17} />,
          label: t(
            isAllPinned ? 'batch_unpinTabs' : 'batch_pinTabs',
            countLabel,
          ),
          kind: 'primary',
          execute: () =>
            void batch.performTabAction(isAllPinned ? 'unpin' : 'pin'),
        },
        {
          id: 'duplicate-selected-tabs',
          icon: <Layers size={17} />,
          label: t('batch_duplicateTabs', countLabel),
          kind: 'primary',
          execute: () => void batch.performTabAction('duplicate'),
        },
        {
          id: 'reload-selected-tabs',
          icon: <RefreshCw size={17} />,
          label: t('batch_reloadTabs', countLabel),
          kind: 'primary',
          execute: () => void batch.performTabAction('reload'),
        },
      )
      if (hasAudioState) {
        items.push({
          id: areAllMuted ? 'unmute-selected-tabs' : 'mute-selected-tabs',
          icon: areAllMuted ? <Volume2 size={17} /> : <VolumeOff size={17} />,
          label: t(
            areAllMuted ? 'batch_unmuteTabs' : 'batch_muteTabs',
            countLabel,
          ),
          kind: 'primary',
          execute: () =>
            void batch.performTabAction(areAllMuted ? 'unmute' : 'mute'),
        })
      }
    }

    if (renameState.visible) {
      const selectedGroupId = [...selection.groupIds][0]
      items.push({
        id: 'rename-selected-group',
        icon: <Pencil size={17} />,
        label: t('groupContextMenu_renameGroup'),
        kind: 'secondary',
        disabled: !renameState.enabled,
        disabledReason: renameState.reason,
        execute: () => {
          if (selectedGroupId !== undefined) onRenameGroup?.(selectedGroupId)
        },
      })
    }

    if (selectedGroupCount > 0) {
      const targetCollapsed = collapseSelectedGroups
      items.push({
        id: 'toggle-selected-groups',
        icon: targetCollapsed ? (
          <ChevronUp size={17} />
        ) : (
          <ChevronDown size={17} />
        ),
        label: t(
          targetCollapsed
            ? 'groupContextMenu_collapseGroup'
            : 'groupContextMenu_expandGroup',
        ),
        kind: 'secondary',
        execute: () => {
          const groupIds = selectedGroups
            .filter((group) => group.collapsed !== targetCollapsed)
            .map((group) => group.id)
          void batch.performGroupAction(
            { type: 'set-collapse', collapsed: targetCollapsed },
            groupIds,
          )
        },
      })
      items.push({
        id: 'change-selected-group-color',
        icon: <Palette size={17} />,
        label: t('groupContextMenu_changeColor'),
        kind: 'secondary',
        execute: () => {},
        panel: ({ onClose }) => (
          <GroupColorPanel
            selectedGroups={selectedGroups}
            onSelect={(color) => {
              void batch
                .performGroupAction(
                  { type: 'change-color', color },
                  selectedGroups.map((group) => group.id),
                )
                .finally(onClose)
            }}
          />
        ),
      })
      items.push({
        id: 'ungroup-selected-groups',
        icon: <Ungroup size={17} />,
        label: t('batch_ungroupTabs', tt('nTabs', selectedGroupTabIds.length)),
        kind: 'secondary',
        disabled: selectedGroupTabIds.length === 0,
        execute: () =>
          void batch.performTabAction('ungroup', selectedGroupTabIds),
      })
    }

    if (ungroupTabIds.length > 0 && selectedGroupCount === 0) {
      items.push({
        id: 'remove-selected-tabs-from-group',
        icon: <Ungroup size={17} />,
        label: t('batch_removeFromGroup', tt('nTabs', ungroupTabIds.length)),
        kind: 'secondary',
        execute: () => void batch.performTabAction('ungroup', ungroupTabIds),
      })
    }

    if (selectedTabCount > 0) {
      items.push({
        id: 'copy-selected-tabs',
        icon: <Copy size={17} />,
        label: t('batch_copyTabs', countLabel),
        kind: 'secondary',
        execute: () => {},
        panel: ({ onClose }) => (
          <ActionPanelList
            onAction={onClose}
            actions={[
              {
                label: t('batch_copyUrls'),
                icon: <Link2 size={16} />,
                execute: () => void batch.copyTabs('urls'),
              },
              {
                label: t('batch_copyTitles'),
                icon: <FileText size={16} />,
                execute: () => void batch.copyTabs('titles'),
              },
              {
                label: t('batch_copyTitlesAndUrls'),
                icon: <Copy size={16} />,
                execute: () => void batch.copyTabs('titles-and-urls'),
              },
            ]}
          />
        ),
      })
    }

    if (singleTargetTab) {
      const siblingTabs = batch.snapshot.tabs.filter(
        (tab) => tab.windowId === singleTargetTab.windowId && !tab.pinned,
      )
      const closeOtherCount = siblingTabs.filter(
        (tab) => tab.id !== singleTargetTab.id,
      ).length
      const closeBelowCount = siblingTabs.filter(
        (tab) => tab.index > singleTargetTab.index,
      ).length
      if (closeOtherCount > 0) {
        items.push({
          id: 'close-other-tabs',
          icon: <Trash2 size={17} />,
          label: t('tabContextMenu_closeOtherTabs'),
          kind: 'secondary',
          execute: () =>
            void batch.closeRelativeToTab(singleTargetTab.id, 'other'),
        })
      }
      if (closeBelowCount > 0) {
        items.push({
          id: 'close-tabs-below',
          icon: <ArrowDown size={17} />,
          label: t('tabContextMenu_closeTabsBelow'),
          kind: 'secondary',
          execute: () =>
            void batch.closeRelativeToTab(singleTargetTab.id, 'below'),
        })
      }
    }

    if (windowExclusive && selectedWindowIds.length > 0) {
      const focusedWindowId = selectedWindowIds[0]
      if (
        selectedWindowIds.length === 1 &&
        focusedWindowId !== undefined &&
        focusedWindowId !== selectedWindowId
      ) {
        items.push({
          id: 'focus-selected-window',
          icon: <Focus size={17} />,
          label: t('windowContextMenu_focusWindow'),
          kind: 'secondary',
          execute: () =>
            void batch.performWindowAction('focus', [focusedWindowId]),
        })
      }
      items.push({
        id: 'close-selected-windows',
        icon: <Trash2 size={17} />,
        label:
          selectedWindowIds.length === 1
            ? t('windowContextMenu_closeWindow')
            : t('batch_closeWindows', String(selectedWindowIds.length)),
        kind: 'secondary',
        destructive: true,
        execute: () =>
          void batch.performWindowAction('close', selectedWindowIds),
      })
    }

    return items
  }, [
    batch,
    collapseSelectedGroups,
    countLabel,
    hasAudioState,
    groupDisabledReason,
    groups,
    hasSelection,
    isAllPinned,
    isMac,
    moveDisabledReason,
    onRenameGroup,
    renameState,
    selectedGroupCount,
    selectedGroupTabIds,
    selectedGroups,
    selectedTabCount,
    selectedTabs,
    selectedWindowIds,
    selectedWindowId,
    selection,
    selectedGroupIds,
    singleTargetTab,
    sourceWindowId,
    ungroupTabIds,
    windowExclusive,
    windows,
    areAllMuted,
  ])

  return {
    actions,
    selectedTabCount,
    selectedWindowCount,
    selectedGroupCount,
  }
}

const ActionPanelList = ({
  actions,
  onAction,
}: {
  actions: PanelAction[]
  onAction?: () => void
}) => (
  <div className="py-1">
    {actions.map((action) => (
      <button
        key={action.label}
        type="button"
        onClick={() => {
          action.execute()
          onAction?.()
        }}
        disabled={action.disabled}
        title={action.disabledReason}
        className={`
          hover:bg-highlighted/50
          focus-visible:bg-highlighted/50 focus-visible:outline-none
          flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors
          disabled:cursor-not-allowed disabled:opacity-45
          ${action.destructive ? 'text-destructive' : 'text-popover-foreground'}
        `}
      >
        <span className="text-muted flex-shrink-0">{action.icon}</span>
        <span className="flex-1 truncate text-left">{action.label}</span>
      </button>
    ))}
  </div>
)

const GroupColorPanel = ({
  selectedGroups,
  onSelect,
}: {
  selectedGroups: readonly BrowserTabGroup[]
  onSelect: (color: BrowserTabGroupColor) => void
}) => (
  <ActionPanelList
    actions={TAB_GROUP_COLOR_IDS.map((color) => ({
      label: t(`groupColor_${color}`),
      icon: (
        <span
          role="img"
          aria-label={`${t(`groupColor_${color}`)} color swatch`}
          className={`
            size-4 flex-shrink-0 rounded-full border border-black/20
            ${getGroupColorClasses(color).dot}
          `}
        />
      ),
      execute: () => onSelect(color),
      disabled: selectedGroups.length === 0,
      disabledReason:
        selectedGroups.length === 0
          ? 'Select at least one tab group.'
          : undefined,
    }))}
    onAction={() => {}}
  />
)
