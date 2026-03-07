import { AnimatePresence } from 'framer-motion'
import { memo } from 'react'
import { BrowserTabGroupItem } from './BrowserTabGroupItem'
import { BrowserTabItem } from './BrowserTabItem'
import { TabList, TabListItem } from './TabList'
import { cn } from './utils/cn'
import type { BrowserTabGroupColor } from '@extension/chrome/tabGroup/BrowserTabGroup'
import type { ReactNode } from 'react'

export type BrowserTabListID = number | string

export type BrowserTabListTab = {
  id: BrowserTabListID
  title?: string
  url?: string
  favicon?: ReactNode
  active?: boolean
  loading?: boolean
  blurred?: boolean
  pinned?: boolean
  discarded?: boolean
  audio?: 'muted' | 'on' | 'off'
  lastAccessed?: number
}

export type BrowserTabListGroup = {
  id: BrowserTabListID
  title?: string
  color?: BrowserTabGroupColor
  collapsed?: boolean
  active?: boolean
  isRenaming?: boolean
}

export type BrowserTabListItemData =
  | { type: 'tab'; tab: BrowserTabListTab }
  | { type: 'group'; group: BrowserTabListGroup; tabs: BrowserTabListTab[] }

type BrowserTabRenderArgs = {
  tab: BrowserTabListTab
  selected: boolean
  duplicate: boolean
  isMultiSelectMode: boolean
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  onClose?: () => void
}

type BrowserTabGroupRenderArgs = {
  group: BrowserTabListGroup
  tabs: BrowserTabListTab[]
  selected: boolean
  selectedTabIds: Set<BrowserTabListID>
  duplicateTabIds: Set<BrowserTabListID>
  isMultiSelectMode: boolean
  onSelect?: (event: React.MouseEvent) => void
  onTabClick?: (
    tab: BrowserTabListTab,
    event: React.MouseEvent<HTMLDivElement>,
  ) => void
  onTabClose?: (tab: BrowserTabListTab) => void
  onToggleCollapse?: () => void
  onRenameComplete?: (newTitle: string) => void
  onRenameCancel?: () => void
  onClose?: () => void
  children?: ReactNode
}

export type BrowserTabListProps = {
  items: BrowserTabListItemData[]
  className?: string
  selectedTabIds?: Set<BrowserTabListID>
  selectedGroupIds?: Set<BrowserTabListID>
  duplicateTabIds?: Set<BrowserTabListID>
  isMultiSelectMode?: boolean
  onTabClick?: (
    tab: BrowserTabListTab,
    event: React.MouseEvent<HTMLDivElement>,
  ) => void
  onTabClose?: (tab: BrowserTabListTab) => void
  onGroupSelect?: (group: BrowserTabListGroup, event: React.MouseEvent) => void
  onGroupToggleCollapse?: (group: BrowserTabListGroup) => void
  onGroupRenameComplete?: (group: BrowserTabListGroup, newTitle: string) => void
  onGroupRenameCancel?: (group: BrowserTabListGroup) => void
  onGroupClose?: (group: BrowserTabListGroup) => void
  renderTabItem?: (args: BrowserTabRenderArgs) => ReactNode
  renderGroupItem?: (args: BrowserTabGroupRenderArgs) => ReactNode
}

const emptySelection = new Set<BrowserTabListID>()

export const BrowserTabList = memo(
  ({
    items,
    className,
    selectedTabIds = emptySelection,
    selectedGroupIds = emptySelection,
    duplicateTabIds = emptySelection,
    isMultiSelectMode = false,
    onTabClick,
    onTabClose,
    onGroupSelect,
    onGroupToggleCollapse,
    onGroupRenameComplete,
    onGroupRenameCancel,
    onGroupClose,
    renderTabItem,
    renderGroupItem,
  }: BrowserTabListProps) => {
    const defaultRenderTabItem = ({
      tab,
      selected,
      duplicate,
      isMultiSelectMode: tabIsMultiSelectMode,
      onClick,
      onClose,
    }: BrowserTabRenderArgs) => (
      <BrowserTabItem
        tabId={tab.id}
        title={tab.title || 'Untitled'}
        url={tab.url}
        favicon={tab.favicon}
        active={tab.active}
        selected={selected}
        loading={tab.loading}
        blurred={tab.blurred}
        pinned={tab.pinned}
        discarded={tab.discarded}
        audio={tab.audio}
        lastAccessed={tab.lastAccessed}
        duplicate={duplicate}
        isMultiSelectMode={tabIsMultiSelectMode}
        onClick={onClick}
        onClose={onClose}
      />
    )

    const defaultRenderGroupItem = ({
      group,
      selected,
      isMultiSelectMode: groupIsMultiSelectMode,
      onSelect,
      onToggleCollapse,
      onRenameComplete,
      onRenameCancel,
      onClose,
      children,
    }: BrowserTabGroupRenderArgs) => (
      <BrowserTabGroupItem
        groupId={group.id}
        title={group.title}
        color={group.color}
        collapsed={group.collapsed}
        active={group.active}
        isRenaming={group.isRenaming}
        selected={selected}
        isMultiSelectMode={groupIsMultiSelectMode}
        onSelect={onSelect}
        onRenameComplete={onRenameComplete}
        onRenameCancel={onRenameCancel}
        onToggleCollapse={onToggleCollapse}
        onClose={onClose}
      >
        {children}
      </BrowserTabGroupItem>
    )

    return (
      <TabList className={cn(className)}>
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => {
            if (item.type === 'tab') {
              return (
                <TabListItem key={item.tab.id}>
                  {(renderTabItem || defaultRenderTabItem)({
                    tab: item.tab,
                    selected: selectedTabIds.has(item.tab.id),
                    duplicate: duplicateTabIds.has(item.tab.id),
                    isMultiSelectMode,
                    onClick: (event) => onTabClick?.(item.tab, event),
                    onClose: onTabClose
                      ? () => onTabClose(item.tab)
                      : undefined,
                  })}
                </TabListItem>
              )
            }

            return (
              <TabListItem key={item.group.id}>
                {/*
                  Build grouped tab content once and allow app-layer wrappers
                  (e.g. context menus) to decide how to compose around it.
                */}
                {(() => {
                  const groupChildren = !item.group.collapsed ? (
                    <TabList className="gap-0.5 pl-2">
                      {item.tabs.map((tab) => (
                        <TabListItem key={tab.id}>
                          {(renderTabItem || defaultRenderTabItem)({
                            tab,
                            selected: selectedTabIds.has(tab.id),
                            duplicate: duplicateTabIds.has(tab.id),
                            isMultiSelectMode,
                            onClick: (event) => onTabClick?.(tab, event),
                            onClose: onTabClose
                              ? () => onTabClose(tab)
                              : undefined,
                          })}
                        </TabListItem>
                      ))}
                    </TabList>
                  ) : undefined

                  return (renderGroupItem || defaultRenderGroupItem)({
                    group: item.group,
                    tabs: item.tabs,
                    selected: selectedGroupIds.has(item.group.id),
                    selectedTabIds,
                    duplicateTabIds,
                    isMultiSelectMode,
                    onSelect: (event) => onGroupSelect?.(item.group, event),
                    onTabClick: onTabClick,
                    onTabClose: onTabClose,
                    onToggleCollapse: onGroupToggleCollapse
                      ? () => onGroupToggleCollapse(item.group)
                      : undefined,
                    onRenameComplete: onGroupRenameComplete
                      ? (newTitle) =>
                          onGroupRenameComplete(item.group, newTitle)
                      : undefined,
                    onRenameCancel: onGroupRenameCancel
                      ? () => onGroupRenameCancel(item.group)
                      : undefined,
                    onClose: onGroupClose
                      ? () => onGroupClose(item.group)
                      : undefined,
                    children: groupChildren,
                  })
                })()}
              </TabListItem>
            )
          })}
        </AnimatePresence>
      </TabList>
    )
  },
)
