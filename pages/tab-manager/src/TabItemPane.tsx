import { DropIndicator } from './DropIndicator'
import {
  DragDropProvider,
  useDragDropContext,
  makeItemKey,
} from './hooks/DragDropContext'
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
import { memo, useCallback, useState, Fragment } from 'react'
import type {
  BrowserTab,
  BrowserTabGroup,
  BrowserTabID,
  BrowserWindowID,
  TabListItem as TabListItemType,
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
    prevItemKey,
    prevInsideGroupId,
  }: {
    tab: BrowserTab
    groups: BrowserTabGroup[]
    currentWindowId?: number
    prevItemKey: string | null
    prevInsideGroupId?: number
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
        <TabItemRow
          tab={tab}
          prevItemKey={prevItemKey}
          prevInsideGroupId={prevInsideGroupId}
          onActivate={onActivate}
          onClose={actions.close}
        />
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
    prevItemKey,
    prevInsideGroupId,
  }: {
    group: BrowserTabGroup
    tabs: BrowserTab[]
    currentWindowId?: number
    groups: BrowserTabGroup[]
    prevItemKey: string | null
    prevInsideGroupId?: number
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
    const { shouldShowIndicatorAfter } = useDragDropContext()

    // For tabs inside the group, build the item keys
    // Previous key for first tab in group is the group itself (for indicator before first tab in group)
    const groupItemKey = makeItemKey('group', group.id)

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
          prevItemKey={prevItemKey}
          prevInsideGroupId={prevInsideGroupId}
          isActive={isActive}
          isRenaming={isRenaming}
          onRenameComplete={handleRenameComplete}
          onRenameCancel={handleRenameCancel}
          onToggleCollapse={actions.toggleCollapse}
          onClose={actions.close}
        >
          {!group.collapsed && (
            <TabList className="gap-0.5 pl-2">
              {tabs.map((tab, tabIndex) => {
                // Previous item for tabs in group:
                // - First tab: previous is the group header
                // - Other tabs: previous is the prior tab
                const tabPrevKey =
                  tabIndex === 0
                    ? groupItemKey
                    : makeItemKey('tab', tabs[tabIndex - 1].id)
                const tabItemKey = makeItemKey('tab', tab.id)
                // The next item after the previous position is this tab
                const tabNextKey = tabItemKey
                // For tabs inside a group, the previous item is always in the same group
                // (either the group header itself, or another tab in the group)
                const tabPrevInsideGroupId = group.id

                return (
                  <Fragment key={tab.id}>
                    <DropIndicator
                      show={shouldShowIndicatorAfter(tabPrevKey, tabNextKey)}
                    />
                    <TabListItem>
                      <TabItemWithContextMenu
                        tab={tab}
                        groups={groups}
                        currentWindowId={currentWindowId}
                        prevItemKey={tabPrevKey}
                        prevInsideGroupId={tabPrevInsideGroupId}
                      />
                    </TabListItem>
                    {/* Show indicator after last tab in group */}
                    {tabIndex === tabs.length - 1 && (
                      <DropIndicator
                        show={shouldShowIndicatorAfter(tabItemKey, undefined)}
                      />
                    )}
                  </Fragment>
                )
              })}
            </TabList>
          )}
        </TabGroupHeader>
      </TabGroupContextMenu>
    )
  },
)

/**
 * Gets the item key for a TabListItem
 */
const getItemKey = (item: TabListItemType): string => {
  if (item.type === 'tab') {
    return makeItemKey('tab', item.tab.id)
  }
  return makeItemKey('group', item.group.id)
}

/**
 * Gets the previous item key for a given index in the items list
 */
const getPrevItemKey = (
  items: TabListItemType[],
  index: number,
): string | null => {
  if (index === 0) return null

  const prevItem = items[index - 1]
  if (prevItem.type === 'tab') {
    return makeItemKey('tab', prevItem.tab.id)
  }
  // For groups, the "after" position is after the last tab in the group
  // But for determining drop position BEFORE this item, we use the group key
  return makeItemKey('group', prevItem.group.id)
}

/**
 * Gets the next item key for a given index in the items list (the item itself)
 */
const getNextItemKey = (
  items: TabListItemType[],
  index: number,
): string | undefined => {
  if (index >= items.length) return undefined
  return getItemKey(items[index])
}

/**
 * Gets the group ID of the previous item (if it's in a group)
 * For groups, returns the last tab's group (which is the group itself)
 */
const getPrevInsideGroupId = (
  items: TabListItemType[],
  index: number,
): number | undefined => {
  if (index === 0) return undefined

  const prevItem = items[index - 1]
  if (prevItem.type === 'tab') {
    const groupId = prevItem.tab.groupId
    return groupId !== undefined && groupId !== -1 ? groupId : undefined
  }
  // Previous item is a group - tabs after a group header go into that group
  // But when dropping BEFORE a group (i.e., after the previous item which is a group),
  // the dropped item should go AFTER that group, not inside it
  // So we return undefined here
  return undefined
}

const TabListContent = ({
  items,
  groups,
  currentWindowId,
}: {
  items: TabListItemType[]
  groups: BrowserTabGroup[]
  currentWindowId?: number
}) => {
  const { shouldShowIndicatorAtStart, shouldShowIndicatorAfter } =
    useDragDropContext()

  // First item key for detecting "drop at start" current position
  const firstItemKey = items.length > 0 ? getItemKey(items[0]) : undefined

  return (
    <TabList>
      {/* Drop indicator at the very start */}
      <DropIndicator show={shouldShowIndicatorAtStart(firstItemKey)} />

      {items.map((item, index) => {
        const itemKey = getItemKey(item)
        const prevItemKey = getPrevItemKey(items, index)
        const prevInsideGroupId = getPrevInsideGroupId(items, index)
        // The "next" item after the previous position is this item
        const nextItemKey = getNextItemKey(items, index)

        if (item.type === 'tab') {
          return (
            <Fragment key={item.tab.id}>
              <DropIndicator
                show={
                  prevItemKey !== null &&
                  shouldShowIndicatorAfter(prevItemKey, nextItemKey)
                }
              />
              <TabListItem>
                <TabItemWithContextMenu
                  tab={item.tab}
                  groups={groups}
                  currentWindowId={currentWindowId}
                  prevItemKey={prevItemKey}
                  prevInsideGroupId={prevInsideGroupId}
                />
              </TabListItem>
              {/* Show indicator after last item */}
              {index === items.length - 1 && (
                <DropIndicator
                  show={shouldShowIndicatorAfter(itemKey, undefined)}
                />
              )}
            </Fragment>
          )
        }

        return (
          <Fragment key={item.group.id}>
            <DropIndicator
              show={
                prevItemKey !== null &&
                shouldShowIndicatorAfter(prevItemKey, nextItemKey)
              }
            />
            <TabListItem>
              <TabGroupWithContextMenu
                group={item.group}
                tabs={item.tabs}
                currentWindowId={currentWindowId}
                groups={groups}
                prevItemKey={prevItemKey}
                prevInsideGroupId={prevInsideGroupId}
              />
            </TabListItem>
            {/* Show indicator after last item (after the entire group) */}
            {index === items.length - 1 && (
              <DropIndicator
                show={shouldShowIndicatorAfter(itemKey, undefined)}
              />
            )}
          </Fragment>
        )
      })}
    </TabList>
  )
}

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
}

export const TabItemPane = ({ browserWindowId }: TabItemPaneProps) => {
  const items = useTabListItems(browserWindowId)
  const groups = useBrowserTabGroupsByWindowId(browserWindowId)
  const currentWindow = useCurrentBrowserWindow()
  const currentWindowId = currentWindow?.id

  return (
    <DragDropProvider>
      <div
        key={`window-tabs-${browserWindowId}`}
        className="pb-4"
        data-tab-pane
      >
        <div className="space-y-4 p-2">
          <TabListContent
            items={items}
            groups={groups}
            currentWindowId={currentWindowId}
          />
        </div>
      </div>
    </DragDropProvider>
  )
}
