import { activateTab } from '@extension/chrome/actions/tabs/activateTab'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabs } from '@extension/chrome/tab/useBrowserTabs'
import { useBrowserTabGroupsByWindowId } from '@extension/chrome/tabGroup/useBrowserTabGroupsByWindowId'
import { usePlatformInfo } from '@extension/chrome/usePlatformInfo'
import { useTabListItems } from '@extension/chrome/useTabListItems'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { t } from '@extension/i18n/i18n'
import { Profiler } from '@extension/shared/Profiler'
import { BrowserTabItem } from '@extension/ui/BrowserTabItem'
import { BrowserTabList } from '@extension/ui/BrowserTabList'
import { TabContextMenu } from '@extension/ui/context-menu/TabContextMenu'
import { TabGroupContextMenu } from '@extension/ui/context-menu/TabGroupContextMenu'
import { Favicon } from '@extension/ui/Favicon'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTabActions } from './hooks/useTabActions'
import { useTabGroupActions } from './hooks/useTabGroupActions'
import { useSelectionInteraction, useSelectionStore } from './selection'
import { TabGroupHeader } from './TabGroupHeader'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { BrowserTabID } from '@extension/chrome/tab/BrowserTabID'
import type {
  BrowserTabGroup,
  BrowserTabGroupColor,
} from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { BrowserWindowID } from '@extension/chrome/window/BrowserWindowID'
import type { TabContextMenuLabels } from '@extension/ui/context-menu/TabContextMenu'
import type { TabGroupContextMenuLabels } from '@extension/ui/context-menu/TabGroupContextMenu'

// Build label objects for context menus
const tabContextMenuLabels: TabContextMenuLabels = {
  duplicateTab: t('tabContextMenu_duplicateTab'),
  reload: t('tabContextMenu_reload'),
  pinTab: t('tabContextMenu_pinTab'),
  unpinTab: t('tabContextMenu_unpinTab'),
  muteTab: t('tabContextMenu_muteTab'),
  unmuteTab: t('tabContextMenu_unmuteTab'),
  addToGroup: t('tabContextMenu_addToGroup'),
  newGroup: t('tabContextMenu_newGroup'),
  untitledGroup: t('tabContextMenu_untitledGroup'),
  removeFromGroup: t('tabContextMenu_removeFromGroup'),
  moveToWindow: t('tabContextMenu_moveToWindow'),
  newWindow: t('tabContextMenu_newWindow'),
  copy: t('tabContextMenu_copy'),
  copyUrl: t('tabContextMenu_copyUrl'),
  copyTitle: t('tabContextMenu_copyTitle'),
  copyTitleAndUrl: t('tabContextMenu_copyTitleAndUrl'),
  closeOtherTabs: t('tabContextMenu_closeOtherTabs'),
  closeTabsBelow: t('tabContextMenu_closeTabsBelow'),
  closeTab: t('tabContextMenu_closeTab'),
  windowLabelPopup: t('windowLabel_popup'),
  windowLabelDevtools: t('windowLabel_devtools'),
  windowLabelPrivate: t('windowLabel_privateMac'),
  windowLabelIncognito: t('windowLabel_incognito'),
  windowLabelDefault: (id: string) => t('windowLabel_default', id),
}

const tabGroupContextMenuLabels: TabGroupContextMenuLabels = {
  expandGroup: t('groupContextMenu_expandGroup'),
  collapseGroup: t('groupContextMenu_collapseGroup'),
  renameGroup: t('groupContextMenu_renameGroup'),
  changeColor: t('groupContextMenu_changeColor'),
  colorLabels: {
    grey: t('groupColor_grey'),
    blue: t('groupColor_blue'),
    red: t('groupColor_red'),
    yellow: t('groupColor_yellow'),
    green: t('groupColor_green'),
    pink: t('groupColor_pink'),
    purple: t('groupColor_purple'),
    cyan: t('groupColor_cyan'),
    orange: t('groupColor_orange'),
  },
  ungroupTabs: t('groupContextMenu_ungroupTabs'),
  moveToNewWindow: t('groupContextMenu_moveToNewWindow'),
  copyAllUrls: t('groupContextMenu_copyAllUrls'),
  closeGroup: t('groupContextMenu_closeGroup'),
}

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
    onClick,
  }: {
    tab: BrowserTab
    selected: boolean
    duplicate: boolean
    isMultiSelectMode?: boolean
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  }) => {
    const actions = useTabActions(tab)
    return (
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
        onClose={actions.close}
      />
    )
  },
)

const TabItemWithContextMenu = memo(
  ({
    tab,
    groups,
    currentWindowId,
    selected,
    duplicate,
    isMultiSelectMode,
    onClick,
  }: {
    tab: BrowserTab
    groups: BrowserTabGroup[]
    currentWindowId?: number
    selected?: boolean
    duplicate?: boolean
    isMultiSelectMode?: boolean
    onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  }) => {
    const actions = useTabActions(tab)
    const windows = useBrowserWindows()
    const { data: platformInfo } = usePlatformInfo()
    const isMac = platformInfo?.os === 'mac'

    return (
      <Profiler id="TabItemPane.BrowserTabItem">
        <TabContextMenu
          tab={tab}
          groups={groups}
          windows={windows}
          currentWindowId={currentWindowId}
          labels={tabContextMenuLabels}
          isMac={isMac}
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
          <TabItemBrowserTabItem
            tab={tab}
            selected={selected ?? false}
            duplicate={duplicate ?? false}
            isMultiSelectMode={isMultiSelectMode}
            onClick={onClick}
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
    selected,
    isMultiSelectMode,
    onSelectGroup,
    children,
  }: {
    group: BrowserTabGroup
    tabs: BrowserTab[]
    selected?: boolean
    isMultiSelectMode?: boolean
    onSelectGroup?: (event: React.MouseEvent) => void
    children?: React.ReactNode
  }) => {
    // Memoize tabIds array to maintain stable reference
    const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs])
    const actions = useTabGroupActions(group, tabIds)
    const [isRenaming, setIsRenaming] = useState(false)
    const selectionStore = useSelectionStore

    const handleRename = useCallback(() => {
      setIsRenaming(true)
    }, [])

    const handleRenameFromContextMenu = useCallback(() => {
      // Let the context menu finish closing before mounting/focusing the input.
      requestAnimationFrame(() => {
        setIsRenaming(true)
      })
    }, [])

    const handleRenameComplete = useCallback(
      async (newTitle: string) => {
        const nextTitle = newTitle.trim()
        console.log(`title: ${group.title}`)
        console.log(`nextTitle: ${nextTitle}`)
        console.log(
          `nextTitle === group.title: ${nextTitle === (group.title ?? '').trim()}`,
        )
        if (nextTitle === (group.title ?? '').trim()) {
          setIsRenaming(false)
          return
        }
        await actions.rename(nextTitle)
        setIsRenaming(false)
      },
      [actions, group.title],
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
        labels={tabGroupContextMenuLabels}
        onToggleCollapse={handleToggleCollapse}
        onRename={handleRenameFromContextMenu}
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
          onRenameStart={handleRename}
          onToggleCollapse={handleToggleCollapse}
          onClose={actions.close}
        >
          {children}
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
  const allTabs = useBrowserTabs()

  // Selection state - subscribe to Sets directly for proper re-renders
  const selectedTabIds = useSelectionStore((s) => s.tabIds)
  const selectedGroupIds = useSelectionStore((s) => s.groupIds)
  const selectionMode = useSelectionStore((s) => s.mode)
  const isMultiSelectMode = selectionMode === 'multi-select'

  // Selection interaction handlers
  const selectionInteraction = useSelectionInteraction()

  // Compute duplicate status for all tabs (memoized)
  const duplicateTabs = useMemo(() => {
    const urlCounts = new Map<string, number>()
    allTabs.forEach((tab) => {
      if (tab.url) {
        urlCounts.set(tab.url, (urlCounts.get(tab.url) || 0) + 1)
      }
    })
    return new Set(
      allTabs
        .filter((tab) => tab.url && (urlCounts.get(tab.url) || 0) > 1)
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
      )
    },
    [selectionInteraction],
  )

  const handleTabClick = useCallback(
    (tab: BrowserTab, e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) {
        e.preventDefault()
        handleSelectTab(tab.id, e)
      } else {
        handleSelectTab(tab.id, e)
        void onActivateTab(tab.windowId, tab.id)
      }
    },
    [handleSelectTab],
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
        <BrowserTabList
          items={items}
          selectedTabIds={selectedTabIds}
          selectedGroupIds={selectedGroupIds}
          duplicateTabIds={duplicateTabs}
          isMultiSelectMode={isMultiSelectMode}
          onTabClick={(tab, event) => handleTabClick(tab as BrowserTab, event)}
          renderTabItem={({
            tab,
            selected,
            duplicate,
            isMultiSelectMode,
            onClick,
          }) => (
            <TabItemWithContextMenu
              tab={tab as BrowserTab}
              groups={groups}
              currentWindowId={currentWindowId}
              selected={selected}
              duplicate={duplicate}
              isMultiSelectMode={isMultiSelectMode}
              onClick={onClick}
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
            <TabGroupWithContextMenu
              group={group as BrowserTabGroup}
              tabs={tabs as BrowserTab[]}
              selected={selected}
              isMultiSelectMode={isMultiSelectMode}
              onSelectGroup={onSelect}
            >
              {children}
            </TabGroupWithContextMenu>
          )}
          onGroupSelect={(group, event) =>
            handleSelectGroup(group.id as number, event)
          }
        />
      </div>
    </div>
  )
}
