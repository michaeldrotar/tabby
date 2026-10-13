import { AnimatePresence } from 'framer-motion'
import { memo } from 'react'
import { BrowserTabGroupItem } from './BrowserTabGroupItem'
import { BrowserTabItem } from './BrowserTabItem'
import { TabList, TabListItem } from './TabList'
import { cn } from './utils/cn'
import type { BrowserTabGroupColor } from '@extension/core'
import type { ReactNode } from 'react'

export type BrowserTabListID = number | string

export type BrowserTabListTab = {
  id: BrowserTabListID
  renderKey?: BrowserTabListID
  title?: string
  url?: string
  favicon?: ReactNode
  faviconUrl?: string
  active?: boolean
  loading?: boolean
  blurred?: boolean
  pinned?: boolean
  discarded?: boolean
  audio?: 'muted' | 'on' | 'off'
  lastAccessed?: number
  ageLabel?: string
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
  focused: boolean
  hovered: boolean
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
  isRenaming: boolean
  renameTitle?: string
  onRenameTitleChange?: (title: string) => void
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
  focusedTabId?: BrowserTabListID
  hoveredTabId?: BrowserTabListID
  renamingGroupId?: BrowserTabListID | null
  renamingGroupTitle?: string
  onTabClick?: (
    tab: BrowserTabListTab,
    event: React.MouseEvent<HTMLDivElement>,
  ) => void
  onTabClose?: (tab: BrowserTabListTab) => void
  onGroupSelect?: (group: BrowserTabListGroup, event: React.MouseEvent) => void
  onGroupToggleCollapse?: (group: BrowserTabListGroup) => void
  onGroupRenameComplete?: (group: BrowserTabListGroup, newTitle: string) => void
  onGroupRenameTitleChange?: (group: BrowserTabListGroup, title: string) => void
  onGroupRenameCancel?: (group: BrowserTabListGroup) => void
  onGroupClose?: (group: BrowserTabListGroup) => void
  renderTabItem?: (args: BrowserTabRenderArgs) => ReactNode
  renderGroupItem?: (args: BrowserTabGroupRenderArgs) => ReactNode
}

const emptySelection = new Set<BrowserTabListID>()

const shallowEqual = <T extends object>(previous: T, next: T) =>
  Object.keys(previous).length === Object.keys(next).length &&
  Object.keys(previous).every(
    (key) =>
      Object.hasOwn(next, key) &&
      Object.is(previous[key as keyof T], next[key as keyof T]),
  )

const renderDefaultTab = ({
  tab,
  selected,
  duplicate,
  focused,
  hovered,
  isMultiSelectMode,
  onClick,
  onClose,
}: BrowserTabRenderArgs) => (
  <BrowserTabItem
    tabId={tab.id}
    title={tab.title || 'Untitled'}
    url={tab.url}
    active={tab.active}
    loading={tab.loading}
    blurred={tab.blurred}
    pinned={tab.pinned}
    discarded={tab.discarded}
    audio={tab.audio}
    ageLabel={tab.ageLabel}
    lastAccessed={tab.lastAccessed}
    favicon={
      tab.favicon ??
      (tab.faviconUrl ? (
        <img src={tab.faviconUrl} width={20} height={20} alt="" />
      ) : undefined)
    }
    selected={selected}
    duplicate={duplicate}
    isMultiSelectMode={isMultiSelectMode}
    onClick={onClick}
    onClose={onClose}
    data-focus={focused || undefined}
    data-hover={hovered || undefined}
  />
)

const TabRow = memo(
  ({
    tab,
    onTabClick,
    onTabClose,
    renderTabItem,
    ...state
  }: Omit<BrowserTabRenderArgs, 'onClick' | 'onClose'> &
    Pick<BrowserTabListProps, 'onTabClick' | 'onTabClose' | 'renderTabItem'>) =>
    (renderTabItem ?? renderDefaultTab)({
      ...state,
      tab,
      onClick: (event) => onTabClick?.(tab, event),
      onClose: onTabClose ? () => onTabClose(tab) : undefined,
    }),
  (previous, next) => {
    const { tab: previousTab, ...previousState } = previous
    const { tab: nextTab, ...nextState } = next
    return (
      shallowEqual(previousState, nextState) &&
      shallowEqual(previousTab, nextTab)
    )
  },
)

export const BrowserTabList = memo(
  ({
    items,
    className,
    selectedTabIds = emptySelection,
    selectedGroupIds = emptySelection,
    duplicateTabIds = emptySelection,
    isMultiSelectMode = false,
    focusedTabId,
    hoveredTabId,
    renamingGroupId,
    renamingGroupTitle,
    onTabClick,
    onTabClose,
    onGroupSelect,
    onGroupToggleCollapse,
    onGroupRenameComplete,
    onGroupRenameTitleChange,
    onGroupRenameCancel,
    onGroupClose,
    renderTabItem,
    renderGroupItem,
  }: BrowserTabListProps) => {
    const defaultRenderGroupItem = ({
      group,
      selected,
      isMultiSelectMode: groupIsMultiSelectMode,
      isRenaming,
      renameTitle,
      onRenameTitleChange,
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
        isRenaming={isRenaming}
        renameTitle={renameTitle}
        onRenameTitleChange={onRenameTitleChange}
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
      <TabList
        className={cn(className)}
        deferOffscreen={
          items.reduce(
            (count, item) =>
              count + (item.type === 'tab' ? 1 : item.tabs.length),
            0,
          ) > 50
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => {
            if (item.type === 'tab') {
              return (
                <TabListItem key={`tab-${item.tab.renderKey ?? item.tab.id}`}>
                  <TabRow
                    tab={item.tab}
                    selected={selectedTabIds.has(item.tab.id)}
                    duplicate={duplicateTabIds.has(item.tab.id)}
                    focused={focusedTabId === item.tab.id}
                    hovered={hoveredTabId === item.tab.id}
                    isMultiSelectMode={isMultiSelectMode}
                    onTabClick={onTabClick}
                    onTabClose={onTabClose}
                    renderTabItem={renderTabItem}
                  />
                </TabListItem>
              )
            }

            return (
              <TabListItem key={`group-${item.group.id}`}>
                {/*
                  Build grouped tab content once and allow app-layer wrappers
                  (e.g. context menus) to decide how to compose around it.
                */}
                {(() => {
                  const isRenaming =
                    renamingGroupId === undefined
                      ? !!item.group.isRenaming
                      : renamingGroupId === item.group.id
                  const groupChildren = !item.group.collapsed ? (
                    <TabList className="gap-0.5 pl-2">
                      {item.tabs.map((tab) => (
                        <TabListItem key={tab.renderKey ?? tab.id}>
                          <TabRow
                            tab={tab}
                            selected={selectedTabIds.has(tab.id)}
                            duplicate={duplicateTabIds.has(tab.id)}
                            focused={focusedTabId === tab.id}
                            hovered={hoveredTabId === tab.id}
                            isMultiSelectMode={isMultiSelectMode}
                            onTabClick={onTabClick}
                            onTabClose={onTabClose}
                            renderTabItem={renderTabItem}
                          />
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
                    isRenaming,
                    renameTitle: isRenaming ? renamingGroupTitle : undefined,
                    onRenameTitleChange: onGroupRenameTitleChange
                      ? (title) => onGroupRenameTitleChange(item.group, title)
                      : undefined,
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
