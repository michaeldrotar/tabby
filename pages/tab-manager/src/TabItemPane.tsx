import { useTabActions } from './hooks/useTabActions'
import { useTabGroupActions } from './hooks/useTabGroupActions'
import { TabGroupHeader } from './TabGroupHeader'
import { TabItemRow } from './TabItemRow'
import {
  useTabListItems,
  useBrowserTabGroupsByWindowId,
  useBrowserWindows,
  useCurrentBrowserWindow,
} from '@extension/chrome'
import {
  TabList,
  TabListItem,
  TabContextMenu,
  TabGroupContextMenu,
} from '@extension/ui'
import { memo, useCallback, useState } from 'react'
import type {
  BrowserTab,
  BrowserTabGroup,
  BrowserTabID,
  BrowserWindowID,
} from '@extension/chrome'
import type { TabGroupColor } from '@extension/ui'

const onActivateTab = async (
  windowId: BrowserWindowID,
  tabId: BrowserTabID,
): Promise<void> => {
  await chrome.windows.update(windowId, { focused: true })
  await chrome.tabs.update(tabId, { active: true })
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
    const tabIds = tabs.map((t) => t.id)
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
      (color: TabGroupColor) => {
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
