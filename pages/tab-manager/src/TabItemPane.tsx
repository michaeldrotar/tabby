import { activateTab } from '@extension/chrome/actions/tabs/activateTab'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabs } from '@extension/chrome/tab/useBrowserTabs'
import { useTabListItems } from '@extension/chrome/useTabListItems'
import { Profiler } from '@extension/shared/Profiler'
import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { BrowserTabList } from '@extension/ui/BrowserTabList'
import { toast } from '@extension/ui/components/Toaster'
import { Favicon } from '@extension/ui/Favicon'
import { memo, useCallback, useMemo } from 'react'
import { useBatchTabActions } from './actions/useBatchTabActions'
import { useSelectionInteraction, useSelectionStore } from './selection'
import { TabGroupHeader } from './TabGroupHeader'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserTabID } from '@extension/chrome/tab/BrowserTabID'
import type { BrowserTabGroup } from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'

const onActivateTab = async (
  windowId: BrowserWindowID,
  tabId: BrowserTabID,
): Promise<void> => {
  await focusWindow(windowId)
  await activateTab(tabId)
}

const TabItemBrowserTabItem = memo(
  ({
    tab,
    selected,
    duplicate,
    isMultiSelectMode,
    batchActions,
    onClick,
    onContextMenu,
  }: {
    tab: BrowserTab
    selected: boolean
    duplicate: boolean
    isMultiSelectMode?: boolean
    batchActions: ReturnType<typeof useBatchTabActions>
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
    onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void
  }) => (
    <Profiler id="TabItemPane.BrowserTabItem">
      <BrowserTabItem
        tabId={tab.id}
        title={tab.title || 'Untitled'}
        url={tab.url}
        favicon={tab.url ? <Favicon pageUrl={tab.url} size={20} /> : undefined}
        active={tab.active}
        selected={selected}
        loading={
          tab.lifecycle === 'initializing' ||
          tab.lifecycle === 'loading' ||
          tab.lifecycle === 'reloading'
        }
        blurred={
          tab.lifecycle === 'initializing' || tab.lifecycle === 'loading'
        }
        pinned={tab.pinned}
        discarded={tab.discarded}
        audio={tab.mutedInfo?.muted ? 'muted' : tab.audible ? 'on' : undefined}
        lastAccessed={tab.lastAccessed}
        duplicate={duplicate}
        isMultiSelectMode={isMultiSelectMode}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onClose={() =>
          void batchActions.close({ type: 'tab', id: tab.id }, [tab.id])
        }
      />
    </Profiler>
  ),
)

const TabGroupItem = memo(
  ({
    group,
    tabs,
    selected,
    isMultiSelectMode,
    onSelectGroup,
    onContextMenu,
    batchActions,
    renamingGroupId,
    onRenameGroupStart,
    onRenameGroupEnd,
    children,
  }: {
    group: BrowserTabGroup
    tabs: BrowserTab[]
    selected?: boolean
    isMultiSelectMode?: boolean
    onSelectGroup?: (event: React.MouseEvent) => void
    onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void
    batchActions: ReturnType<typeof useBatchTabActions>
    renamingGroupId?: number
    onRenameGroupStart?: (groupId: number) => void
    onRenameGroupEnd?: () => void
    children?: React.ReactNode
  }) => {
    const tabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs])
    const isRenaming = renamingGroupId === group.id
    const handleRenameStart = useCallback(() => {
      onRenameGroupStart?.(group.id)
    }, [group.id, onRenameGroupStart])
    const handleRenameComplete = useCallback(
      async (newTitle: string) => {
        const nextTitle = newTitle.trim()
        if (nextTitle === (group.title ?? '').trim()) {
          onRenameGroupEnd?.()
          return
        }
        const result = await batchActions.performGroupAction(
          { type: 'rename', title: nextTitle },
          [group.id],
        )
        if (result.failures.length > 0) {
          toast.error(
            result.failures[0]?.message ?? 'Could not rename this tab group.',
          )
          return
        }
        onRenameGroupEnd?.()
      },
      [batchActions, group.id, group.title, onRenameGroupEnd],
    )
    const handleRenameCancel = useCallback(() => {
      onRenameGroupEnd?.()
    }, [onRenameGroupEnd])
    const handleToggleCollapse = useCallback(() => {
      void batchActions.performGroupAction(
        { type: 'set-collapse', collapsed: !group.collapsed },
        [group.id],
      )
    }, [batchActions, group.collapsed, group.id])
    const isActive = tabs.some((tab) => tab.active)

    return (
      <TabGroupHeader
        group={group}
        isActive={isActive}
        isRenaming={isRenaming}
        selected={selected}
        isMultiSelectMode={isMultiSelectMode}
        onSelect={onSelectGroup}
        onContextMenu={onContextMenu}
        onRenameComplete={handleRenameComplete}
        onRenameCancel={handleRenameCancel}
        onRenameStart={handleRenameStart}
        onToggleCollapse={handleToggleCollapse}
        onClose={() =>
          void batchActions.close({ type: 'group', id: group.id }, tabIds)
        }
      >
        {children}
      </TabGroupHeader>
    )
  },
)

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
  renamingGroupId?: number
  onRenameGroupStart?: (groupId: number) => void
  onRenameGroupEnd?: () => void
  onOpenActionMenu: () => void
}

export const TabItemPane = ({
  browserWindowId,
  renamingGroupId,
  onRenameGroupStart,
  onRenameGroupEnd,
  onOpenActionMenu,
}: TabItemPaneProps) => {
  const items = useTabListItems(browserWindowId)
  const allTabs = useBrowserTabs()
  const explicitSelectedGroupIds = useSelectionStore((state) => state.groupIds)
  const selectedWindowIds = useSelectionStore((state) => state.windowIds)
  const selectionMode = useSelectionStore((state) => state.mode)
  const selectionInteraction = useSelectionInteraction()
  const batchActions = useBatchTabActions()

  const selectedGroupIds = useMemo(() => {
    const ids = new Set(explicitSelectedGroupIds)
    if (
      browserWindowId !== undefined &&
      selectedWindowIds.has(browserWindowId)
    ) {
      for (const item of items) {
        if (item.type === 'group') ids.add(item.group.id)
      }
    }
    return ids
  }, [browserWindowId, explicitSelectedGroupIds, items, selectedWindowIds])

  const selectedTabIds = useMemo(
    () => new Set(batchActions.selectedTabIds),
    [batchActions.selectedTabIds],
  )
  const orderedSelectionItems = useMemo(
    () =>
      items.flatMap((item) => {
        if (item.type === 'tab') {
          return [{ type: 'tab' as const, id: item.tab.id }]
        }
        return [
          { type: 'group' as const, id: item.group.id },
          ...(item.group.collapsed
            ? []
            : item.tabs.map((tab) => ({ type: 'tab' as const, id: tab.id }))),
        ]
      }),
    [items],
  )

  const duplicateTabs = useMemo(() => {
    const urlCounts = new Map<string, number>()
    for (const tab of allTabs) {
      if (tab.url) urlCounts.set(tab.url, (urlCounts.get(tab.url) ?? 0) + 1)
    }
    return new Set(
      allTabs
        .filter((tab) => tab.url && (urlCounts.get(tab.url) ?? 0) > 1)
        .map((tab) => tab.id),
    )
  }, [allTabs])

  const handleSelectTab = useCallback(
    (tabId: number, event: React.MouseEvent) => {
      selectionInteraction.handleClick(
        { type: 'tab', id: tabId },
        {
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
        },
        'tab',
        orderedSelectionItems,
      )
    },
    [orderedSelectionItems, selectionInteraction],
  )

  const handleTabClick = useCallback(
    (tab: BrowserTab, event: React.MouseEvent) => {
      handleSelectTab(tab.id, event)
      if (!(event.metaKey || event.ctrlKey || event.shiftKey)) {
        void onActivateTab(tab.windowId, tab.id)
      } else {
        event.preventDefault()
      }
    },
    [handleSelectTab],
  )

  const handleTabContextMenu = useCallback(
    (tab: BrowserTab, event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!selectedTabIds.has(tab.id)) {
        selectionInteraction.handleClick(
          { type: 'tab', id: tab.id },
          { shiftKey: false, metaKey: false, ctrlKey: false },
          'tab',
          orderedSelectionItems,
        )
      }
      onOpenActionMenu()
    },
    [
      onOpenActionMenu,
      orderedSelectionItems,
      selectedTabIds,
      selectionInteraction,
    ],
  )

  const handleSelectGroup = useCallback(
    (groupId: number, event: React.MouseEvent) => {
      selectionInteraction.handleClick(
        { type: 'group', id: groupId },
        {
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
        },
        'tab',
        orderedSelectionItems,
      )
    },
    [orderedSelectionItems, selectionInteraction],
  )

  const handleGroupContextMenu = useCallback(
    (groupId: number, event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!selectedGroupIds.has(groupId)) {
        selectionInteraction.handleClick(
          { type: 'group', id: groupId },
          { shiftKey: false, metaKey: false, ctrlKey: false },
          'tab',
          orderedSelectionItems,
        )
      }
      onOpenActionMenu()
    },
    [
      onOpenActionMenu,
      orderedSelectionItems,
      selectedGroupIds,
      selectionInteraction,
    ],
  )

  return (
    <div key={`window-tabs-${browserWindowId}`} className="pb-4" data-tab-pane>
      <div className="space-y-4 p-2">
        <BrowserTabList
          items={items}
          selectedTabIds={selectedTabIds}
          selectedGroupIds={selectedGroupIds}
          duplicateTabIds={duplicateTabs}
          isMultiSelectMode={selectionMode === 'multi-select'}
          onTabClick={(tab, event) => handleTabClick(tab as BrowserTab, event)}
          renderTabItem={({
            tab,
            selected,
            duplicate,
            isMultiSelectMode,
            onClick,
          }) => (
            <TabItemBrowserTabItem
              tab={tab as BrowserTab}
              selected={selected}
              duplicate={duplicate}
              isMultiSelectMode={isMultiSelectMode}
              batchActions={batchActions}
              onClick={onClick}
              onContextMenu={(event) =>
                handleTabContextMenu(tab as BrowserTab, event)
              }
            />
          )}
          renderGroupItem={({
            group,
            tabs,
            selected,
            isMultiSelectMode,
            onSelect,
            children,
          }) => (
            <TabGroupItem
              group={group as BrowserTabGroup}
              tabs={tabs as BrowserTab[]}
              selected={selected}
              isMultiSelectMode={isMultiSelectMode}
              batchActions={batchActions}
              renamingGroupId={renamingGroupId}
              onRenameGroupStart={onRenameGroupStart}
              onRenameGroupEnd={onRenameGroupEnd}
              onSelectGroup={onSelect}
              onContextMenu={(event) =>
                handleGroupContextMenu(group.id as number, event)
              }
            >
              {children}
            </TabGroupItem>
          )}
          onGroupSelect={(group, event) =>
            handleSelectGroup(group.id as number, event)
          }
        />
      </div>
    </div>
  )
}
