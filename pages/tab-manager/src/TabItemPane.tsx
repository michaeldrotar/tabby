import { activateTab } from '@extension/chrome/actions/tabs/activateTab'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabGroupsByWindowId } from '@extension/chrome/tabGroup/useBrowserTabGroupsByWindowId'
import { useTabListItems } from '@extension/chrome/useTabListItems'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { TabContextMenu } from '@extension/ui/context-menu/TabContextMenu'
import { TabGroupContextMenu } from '@extension/ui/context-menu/TabGroupContextMenu'
import { Profiler } from '@extension/ui/Profiler'
import { TabList, TabListItem } from '@extension/ui/TabList'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTabActions } from './hooks/useTabActions'
import { useTabGroupActions } from './hooks/useTabGroupActions'
import { useSelectionInteraction, useSelectionStore } from './selection'
import { TabGroupHeader } from './TabGroupHeader'
import { TabItemRow } from './TabItemRow'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserTabID } from '@extension/chrome/tab/BrowserTabID'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
} from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'

const onActivateTab = async (
  windowId: BrowserWindowID,
  tabId: BrowserTabID,
): Promise<void> => {
  await focusWindow(windowId)
  await activateTab(tabId)
}

const TabItemWithContextMenu = memo(
  ({
    tab,
    groups,
    currentWindowId,
    selected,
    isMultiSelectMode,
    onSelect,
  }: {
    tab: BrowserTab
    groups: BrowserTabGroup[]
    currentWindowId?: number
    selected?: boolean
    isMultiSelectMode?: boolean
    onSelect?: (event: React.MouseEvent) => void
  }) => {
    const actions = useTabActions(tab)
    const windows = useBrowserWindows()

    const onActivate = useCallback(
      () => onActivateTab(tab.windowId, tab.id),
      [tab.windowId, tab.id],
    )

    return (
      <Profiler id="TabItemPane.TabItemRow">
        <TabContextMenu
          tab={tab}
          groups={groups}
          windows={windows}
          currentWindowId={currentWindowId}
          onPin={actions.pin}
          onUnpin={actions.unpin}
          onMute={actions.mute}
          onUnmute={actions.unmute}
          onDuplicate={actions.duplicate}
          onReload={actions.reload}
          onClose={actions.close}
          onCloseOther={actions.closeOther}
          onCloseAfter={actions.closeAfter}
          onCopyUrl={actions.copyUrl}
          onCopyTitle={actions.copyTitle}
          onCopyTitleAndUrl={actions.copyTitleAndUrl}
          onAddToGroup={actions.addToGroup}
          onAddToNewGroup={actions.addToNewGroup}
          onRemoveFromGroup={actions.removeFromGroup}
          onMoveToWindow={actions.moveToWindow}
          onMoveToNewWindow={actions.moveToNewWindow}
        >
          <TabItemRow
            tabId={tab.id}
            title={tab.title}
            faviconUrl={tab.url}
            isActive={tab.active}
            isHighlighted={tab.highlighted}
            isPinned={tab.pinned}
            isMuted={tab.mutedInfo?.muted}
            isAudible={tab.audible}
            isDiscarded={tab.discarded}
            selected={selected}
            isMultiSelectMode={isMultiSelectMode}
            onActivate={onActivate}
            onSelect={onSelect}
            onClose={actions.close}
          />
        </TabContextMenu>
      </Profiler>
    )
  },
)

const TabGroupWithContextMenu = memo(
  ({
    group,
    tabs,
    currentWindowId,
    groups,
    selected,
    selectedTabIds,
    isMultiSelectMode,
    onSelectGroup,
    onSelectTab,
  }: {
    group: BrowserTabGroup
    tabs: BrowserTab[]
    currentWindowId?: number
    groups: BrowserTabGroup[]
    selected?: boolean
    selectedTabIds: Set<number>
    isMultiSelectMode?: boolean
    onSelectGroup?: (event: React.MouseEvent) => void
    onSelectTab?: (tabId: number, event: React.MouseEvent) => void
  }) => {
    // Memoize tabIds array to maintain stable reference
    const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs])
    const actions = useTabGroupActions(group, tabIds)
    const [isRenaming, setIsRenaming] = useState(false)
    const selectionStore = useSelectionStore

    const handleRename = useCallback(() => {
      setIsRenaming(true)
    }, [])

    const handleRenameComplete = useCallback(
      (newTitle: string) => {
        actions.rename(newTitle)
        setIsRenaming(false)
      },
      [actions],
    )

    const handleRenameCancel = useCallback(() => {
      setIsRenaming(false)
    }, [])

    const handleChangeColor = useCallback(
      (color: BrowserTabGroupColor) => {
        actions.changeColor(color)
      },
      [actions],
    )

    // Wrap toggleCollapse to also remove tabs from selection when collapsing
    const handleToggleCollapse = useCallback(() => {
      // If the group is currently expanded (will be collapsed), remove its tabs from selection
      if (!group.collapsed) {
        const state = selectionStore.getState()
        // Remove each tab in this group from selection
        for (const tabId of tabIds) {
          if (state.tabIds.has(tabId)) {
            state.removeTab(tabId)
          }
        }
      }
      actions.toggleCollapse()
    }, [group.collapsed, tabIds, actions, selectionStore])

    const isActive = tabs.some((t) => t.active)

    return (
      <TabGroupContextMenu
        group={group}
        isCollapsed={group.collapsed}
        onToggleCollapse={handleToggleCollapse}
        onRename={handleRename}
        onChangeColor={handleChangeColor}
        onUngroup={actions.ungroup}
        onCopyUrls={actions.copyUrls}
        onMoveToNewWindow={actions.moveToNewWindow}
        onClose={actions.close}
      >
        <TabGroupHeader
          group={group}
          isActive={isActive}
          isRenaming={isRenaming}
          selected={selected}
          isMultiSelectMode={isMultiSelectMode}
          onSelect={onSelectGroup}
          onRenameComplete={handleRenameComplete}
          onRenameCancel={handleRenameCancel}
          onToggleCollapse={handleToggleCollapse}
          onClose={actions.close}
        >
          {!group.collapsed && (
            <TabList className="gap-0.5 pl-2">
              {tabs.map((tab) => (
                <TabListItem key={tab.id}>
                  <TabItemWithContextMenu
                    tab={tab}
                    groups={groups}
                    currentWindowId={currentWindowId}
                    selected={selectedTabIds.has(tab.id)}
                    isMultiSelectMode={isMultiSelectMode}
                    onSelect={(e) => onSelectTab?.(tab.id, e)}
                  />
                </TabListItem>
              ))}
            </TabList>
          )}
        </TabGroupHeader>
      </TabGroupContextMenu>
    )
  },
)

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
}

export const TabItemPane = ({ browserWindowId }: TabItemPaneProps) => {
  const items = useTabListItems(browserWindowId)
  const groups = useBrowserTabGroupsByWindowId(browserWindowId)
  const currentWindow = useCurrentBrowserWindow()
  const currentWindowId = currentWindow?.id

  // Selection state - subscribe to Sets directly for proper re-renders
  const selectedTabIds = useSelectionStore((s) => s.tabIds)
  const selectedGroupIds = useSelectionStore((s) => s.groupIds)
  const selectionMode = useSelectionStore((s) => s.mode)
  const isMultiSelectMode = selectionMode === 'multi-select'

  // Selection interaction handlers
  const selectionInteraction = useSelectionInteraction()

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
      )
    },
    [selectionInteraction],
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
      )
    },
    [selectionInteraction],
  )

  return (
    <div key={`window-tabs-${browserWindowId}`} className="pb-4" data-tab-pane>
      <div className="space-y-4 p-2">
        <TabList>
          {items.map((item) => {
            if (item.type === 'tab') {
              return (
                <TabListItem key={item.tab.id}>
                  <TabItemWithContextMenu
                    tab={item.tab}
                    groups={groups}
                    currentWindowId={currentWindowId}
                    selected={selectedTabIds.has(item.tab.id)}
                    isMultiSelectMode={isMultiSelectMode}
                    onSelect={(e) => handleSelectTab(item.tab.id, e)}
                  />
                </TabListItem>
              )
            }

            return (
              <TabListItem key={item.group.id}>
                <TabGroupWithContextMenu
                  group={item.group}
                  tabs={item.tabs}
                  currentWindowId={currentWindowId}
                  groups={groups}
                  selected={selectedGroupIds.has(item.group.id)}
                  selectedTabIds={selectedTabIds}
                  isMultiSelectMode={isMultiSelectMode}
                  onSelectGroup={(e) => handleSelectGroup(item.group.id, e)}
                  onSelectTab={handleSelectTab}
                />
              </TabListItem>
            )
          })}
        </TabList>
      </div>
    </div>
  )
}
