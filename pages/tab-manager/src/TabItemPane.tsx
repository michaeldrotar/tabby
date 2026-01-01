import { activateTab } from '@extension/chrome/actions/tabs/activateTab'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabGroupsByWindowId } from '@extension/chrome/tabGroup/useBrowserTabGroupsByWindowId'
import { useTabListItems } from '@extension/chrome/useTabListItems'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { TabContextMenu } from '@extension/ui/context-menu/TabContextMenu'
import { TabGroupContextMenu } from '@extension/ui/context-menu/TabGroupContextMenu'
import { TabList, TabListItem } from '@extension/ui/TabList'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTabActions } from './hooks/useTabActions'
import { useTabGroupActions } from './hooks/useTabGroupActions'
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
  }: {
    tab: BrowserTab
    groups: BrowserTabGroup[]
    currentWindowId?: number
  }) => {
    const actions = useTabActions(tab)
    const windows = useBrowserWindows()

    const onActivate = useCallback(
      () => onActivateTab(tab.windowId, tab.id),
      [tab.windowId, tab.id],
    )

    return (
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
        <TabItemRow tab={tab} onActivate={onActivate} onClose={actions.close} />
      </TabContextMenu>
    )
  },
)

const TabGroupWithContextMenu = memo(
  ({
    group,
    tabs,
    currentWindowId,
    groups,
  }: {
    group: BrowserTabGroup
    tabs: BrowserTab[]
    currentWindowId?: number
    groups: BrowserTabGroup[]
  }) => {
    // Memoize tabIds array to maintain stable reference
    const tabIds = useMemo(() => tabs.map((t) => t.id), [tabs])
    const actions = useTabGroupActions(group, tabIds)
    const [isRenaming, setIsRenaming] = useState(false)

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

    const isActive = tabs.some((t) => t.active)

    return (
      <TabGroupContextMenu
        group={group}
        isCollapsed={group.collapsed}
        onToggleCollapse={actions.toggleCollapse}
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
          onRenameComplete={handleRenameComplete}
          onRenameCancel={handleRenameCancel}
          onToggleCollapse={actions.toggleCollapse}
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
                />
              </TabListItem>
            )
          })}
        </TabList>
      </div>
    </div>
  )
}
