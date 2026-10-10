import { MoreHorizontal, Plus, X } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BrowserTabGroupItem } from '../BrowserTabGroupItem'
import { BrowserTabItem } from '../BrowserTabItem'
import { BrowserTabList } from '../BrowserTabList'
import { useSurface } from '../Surface'
import { SidebarAction } from './ui/SidebarAction'
import { TabManagerShell } from './ui/TabManagerShell'
import { TabManagerSidebar } from './ui/TabManagerSidebar'
import { WindowRailItem } from './ui/WindowRailItem'
import type {
  BrowserTabListItemData,
  BrowserTabListTab,
} from '../BrowserTabList'
import type { BrowserTabGroupColor, SelectionItemRef } from '@extension/core'
import type { KeyboardEvent, MouseEvent } from 'react'

export type TabManagerItem = SelectionItemRef
export type TabManagerTabView = {
  id: number
  title: string
  url?: string
  faviconUrl?: string
  active?: boolean
  loading?: boolean
  pinned?: boolean
  discarded?: boolean
  audio?: 'muted' | 'on' | 'off'
  groupId?: number
  ageLabel?: string
}
export type TabManagerGroupView = {
  id: number
  title?: string
  color?: BrowserTabGroupColor
  collapsed?: boolean
}
export type TabManagerWindowView = {
  id: number
  title: string
  active?: boolean
  tabs: TabManagerTabView[]
  groups: TabManagerGroupView[]
}
export type TabManagerViewModel = {
  windows: TabManagerWindowView[]
  viewedWindowId: number | null
  selectedTabIds: number[]
  selectedGroupIds: number[]
  selectedWindowIds: number[]
  selectionMode: 'default' | 'multi-select'
  sidebarExpanded: boolean
  focusedItem?: TabManagerItem | null
  hoveredItem?: TabManagerItem | null
  actionMenu?: { target?: TabManagerItem } | null
  notice?: { message: string; kind?: 'info' | 'error' } | null
  status?: 'ready' | 'loading' | 'error'
  error?: string
  scrollTop?: number
}
export type TabManagerIntent =
  | { type: 'view-window'; windowId: number }
  | {
      type: 'select-item'
      item: TabManagerItem
      shift?: boolean
      toggle?: boolean
    }
  | { type: 'navigate'; key: string; shift?: boolean; toggle?: boolean }
  | { type: 'toggle-sidebar' }
  | { type: 'create-window' }
  | { type: 'close-tabs'; tabIds: number[] }
  | { type: 'close-window'; windowId: number }
  | { type: 'activate-tab'; tabId: number }
  | { type: 'activate-window'; windowId: number }
  | { type: 'set-group-collapsed'; groupId: number; collapsed: boolean }
  | { type: 'open-action-menu'; target?: TabManagerItem }
  | { type: 'dismiss-action-menu' }
  | { type: 'close-selection' }
  | { type: 'dismiss-notice' }
  | { type: 'scroll'; top: number }
export type TabManagerProps = {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void | Promise<void>
  className?: string
}

const sameItem = (a: TabManagerItem | null | undefined, b: TabManagerItem) =>
  a?.type === b.type && a.id === b.id
const itemAt = (target: EventTarget | null): TabManagerItem | undefined => {
  if (!(target instanceof Element)) return undefined
  const tab = target.closest<HTMLElement>('[data-tab-id]')
  if (tab) return { type: 'tab', id: Number(tab.dataset.tabId) }
  const group = target.closest<HTMLElement>('[data-group-id]')
  if (group) return { type: 'group', id: Number(group.dataset.groupId) }
  const window = target.closest<HTMLElement>('[data-nav-type="window"]')
  if (window) return { type: 'window', id: Number(window.dataset.navId) }
  return undefined
}

/** Complete controlled presentation; behavior and external effects are supplied by its host. */
export const TabManager = ({ model, onIntent, className }: TabManagerProps) => {
  const surface = useSurface()
  const rootRef = useRef<HTMLDivElement>(null)
  const pendingKeyboardFocus = useRef(false)
  const pendingMenuFocus = useRef(false)
  const physicalFocusOwner = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const live = !surface || surface.inputMode === 'live'
  const viewedWindow = model.windows.find(
    (window) => window.id === model.viewedWindowId,
  )
  const send = (intent: TabManagerIntent) => {
    if (!live) return
    if (intent.type === 'open-action-menu') pendingMenuFocus.current = true
    void onIntent(intent)
  }
  const cues = (item: TabManagerItem) => ({
    'data-hover': sameItem(model.hoveredItem, item) || undefined,
    'data-focus': sameItem(model.focusedItem, item) || undefined,
  })
  const select = (item: TabManagerItem, event: MouseEvent) =>
    send({
      type: 'select-item',
      item,
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    })

  useLayoutEffect(() => {
    const viewport = rootRef.current?.querySelector<HTMLElement>(
      '[data-manager-scroll] [data-radix-scroll-area-viewport]',
    )
    if (viewport && viewport.scrollTop !== (model.scrollTop ?? 0))
      viewport.scrollTop = model.scrollTop ?? 0
  }, [model.scrollTop, model.viewedWindowId])
  useLayoutEffect(() => {
    if (!live) return
    const focusModelItem = () => {
      const item = model.focusedItem
      const selector = !item
        ? '[aria-label="New window"]'
        : item.type === 'tab'
          ? `[data-tab-id="${item.id}"] [data-tab-option]`
          : item.type === 'group'
            ? `[data-group-id="${item.id}"] > button`
            : `[data-nav-type="window"][data-nav-id="${item.id}"]`
      rootRef.current
        ?.querySelector<HTMLElement>(selector)
        ?.focus({ preventScroll: true })
    }
    const recoverRemovedOwner = () => {
      const owner = physicalFocusOwner.current
      if (
        owner &&
        !owner.isConnected &&
        document.activeElement === document.body
      ) {
        focusModelItem()
      }
    }
    if (pendingKeyboardFocus.current) {
      pendingKeyboardFocus.current = false
      if (rootRef.current?.contains(document.activeElement)) focusModelItem()
    }
    recoverRemovedOwner()
    // Exit animations can detach a focused row after the model has updated.
    const observer = new MutationObserver(recoverRemovedOwner)
    if (rootRef.current)
      observer.observe(rootRef.current, { childList: true, subtree: true })
    if (surface?.portalHost)
      observer.observe(surface.portalHost, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [
    model.focusedItem,
    model.windows,
    model.actionMenu,
    live,
    surface?.portalHost,
  ])

  useLayoutEffect(() => {
    if (!model.actionMenu || !live || !pendingMenuFocus.current) return
    pendingMenuFocus.current = false
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [model.actionMenu, live])

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!live) return
    const target = event.target as HTMLElement
    if (target.closest('input,textarea,[contenteditable="true"],[role="menu"]'))
      return
    if (
      ![
        'ArrowDown',
        'ArrowUp',
        'ArrowLeft',
        'ArrowRight',
        'ContextMenu',
        'F10',
        'Home',
        'End',
        'Enter',
        ' ',
        'Escape',
        'Delete',
        'Backspace',
      ].includes(event.key) &&
      !((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a')
    )
      return
    if (event.key === 'F10' && !event.shiftKey) return
    // Preserve native activation of controls nested inside selectable rows.
    const control = target.closest('button,[role="button"]')
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      control &&
      !control.matches('[data-nav-type="window"]') &&
      !control.parentElement?.matches('[data-group-id]')
    )
      return
    const item = itemAt(event.target)
    if (!item && event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    if (item && !sameItem(model.focusedItem, item))
      send({ type: 'select-item', item })
    if (item?.type === 'group' && event.key === 'Enter' && !event.shiftKey) {
      const group = viewedWindow?.groups.find((group) => group.id === item.id)
      send({
        type: 'set-group-collapsed',
        groupId: item.id,
        collapsed: !group?.collapsed,
      })
      return
    }
    const opensMenu =
      event.key === 'ContextMenu' ||
      (event.shiftKey && (event.key === 'F10' || event.key === 'Enter'))
    if (opensMenu) {
      pendingMenuFocus.current = true
      pendingKeyboardFocus.current = false
    } else {
      pendingKeyboardFocus.current = true
    }
    send({
      type: 'navigate',
      key: event.key,
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
    })
  }

  const toTab = (tab: TabManagerTabView): BrowserTabListTab => ({
    ...tab,
    ageLabel: tab.ageLabel ?? '',
    favicon: tab.faviconUrl ? (
      <img src={tab.faviconUrl} width={20} height={20} alt="" />
    ) : undefined,
  })
  const items: BrowserTabListItemData[] = []
  const seenGroups = new Set<number>()
  for (const tab of viewedWindow?.tabs ?? []) {
    const group = viewedWindow?.groups.find((group) => group.id === tab.groupId)
    if (!group) items.push({ type: 'tab', tab: toTab(tab) })
    else if (!seenGroups.has(group.id)) {
      seenGroups.add(group.id)
      items.push({
        type: 'group',
        group,
        tabs: viewedWindow!.tabs
          .filter((tab) => tab.groupId === group.id)
          .map(toTab),
      })
    }
  }
  const selectedCount = model.selectedTabIds.length
  const menu = model.actionMenu ? (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label="Selection actions"
      data-manager-action-menu
      onKeyDown={(event) => {
        if (!live) return
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          send({ type: 'dismiss-action-menu' })
          rootRef.current
            ?.querySelector<HTMLElement>('[aria-label="Selection actions"]')
            ?.focus()
        } else if (
          ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
        ) {
          event.preventDefault()
          const entries = Array.from(
            menuRef.current?.querySelectorAll<HTMLElement>(
              '[role="menuitem"]',
            ) ?? [],
          )
          const index = entries.indexOf(event.target as HTMLElement)
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? entries.length - 1
                : (index +
                    (event.key === 'ArrowUp' ? -1 : 1) +
                    entries.length) %
                  entries.length
          entries[next]?.focus()
        }
      }}
      className={`
        border-border bg-popover text-popover-foreground absolute bottom-16
        right-3 z-[80] min-w-48 rounded-lg border p-1 shadow-lg
      `}
    >
      <button
        role="menuitem"
        className={`
          hover:bg-highlighted/50
          w-full rounded p-2 text-left text-sm
        `}
        onClick={() => send({ type: 'close-selection' })}
      >
        Close {selectedCount} selected {selectedCount === 1 ? 'tab' : 'tabs'}
      </button>
      {model.actionMenu.target?.type === 'window' && (
        <button
          role="menuitem"
          className={`
            hover:bg-highlighted/50
            w-full rounded p-2 text-left text-sm
          `}
          onClick={() =>
            send({
              type: 'close-window',
              windowId: model.actionMenu!.target!.id,
            })
          }
        >
          Close window
        </button>
      )}
      <button
        role="menuitem"
        className={`
          hover:bg-highlighted/50
          w-full rounded p-2 text-left text-sm
        `}
        onClick={() => send({ type: 'dismiss-action-menu' })}
      >
        Dismiss menu
      </button>
    </div>
  ) : null
  return (
    <div
      ref={rootRef}
      className="relative h-full min-h-0"
      data-tab-manager
      onFocusCapture={(event) => {
        physicalFocusOwner.current = event.target as HTMLElement
      }}
      onBlurCapture={(event) => {
        const next = event.relatedTarget
        if (
          next &&
          (rootRef.current?.contains(next as Node) ||
            menuRef.current?.contains(next as Node))
        )
          return
        // A removed owner remains recorded until focus recovery observes its detach.
        if ((event.target as HTMLElement).isConnected)
          physicalFocusOwner.current = null
      }}
      onKeyDownCapture={keyDown}
      onPointerDownCapture={(event) => {
        if (
          model.actionMenu &&
          !menuRef.current?.contains(event.target as Node) &&
          !(event.target as Element).closest('[aria-label="Selection actions"]')
        )
          send({ type: 'dismiss-action-menu' })
      }}
      onContextMenu={(event) => {
        const item = itemAt(event.target)
        if (!item) return
        event.preventDefault()
        send({ type: 'open-action-menu', target: item })
      }}
      onScrollCapture={(event) => {
        const element = event.target as HTMLElement
        if (live && element.closest('[data-manager-scroll]'))
          send({ type: 'scroll', top: element.scrollTop })
      }}
    >
      <TabManagerShell
        className={className}
        selectionMode={model.selectionMode}
        sidebar={
          <TabManagerSidebar
            isExpanded={model.sidebarExpanded}
            onToggleExpand={() => send({ type: 'toggle-sidebar' })}
            collapseSidebarLabel="Collapse sidebar"
            expandSidebarLabel="Expand sidebar"
            windowCount={model.windows.length}
            windowList={model.windows.map((window) => (
              <WindowRailItem
                key={window.id}
                id={window.id}
                title={window.title}
                subtitle={`${window.tabs.length} tabs`}
                isActive={window.active ?? false}
                isViewing={window.id === model.viewedWindowId}
                isExpanded={model.sidebarExpanded}
                selected={model.selectedWindowIds.includes(window.id)}
                isMultiSelectMode={model.selectionMode === 'multi-select'}
                {...cues({ type: 'window', id: window.id })}
                onDoubleClick={() =>
                  send({ type: 'activate-window', windowId: window.id })
                }
                onClick={(event) =>
                  select({ type: 'window', id: window.id }, event)
                }
                onClose={() =>
                  send({ type: 'close-window', windowId: window.id })
                }
              />
            ))}
            actions={
              <SidebarAction
                icon={<Plus size={20} />}
                label="New window"
                isExpanded={model.sidebarExpanded}
                onClick={() => send({ type: 'create-window' })}
              />
            }
          />
        }
        actionBar={
          <div
            className={`
              border-border flex min-h-14 items-center justify-between border-t
              px-3
            `}
          >
            <span className="text-muted text-xs" aria-live="polite">
              {selectedCount} selected
            </span>
            <button
              aria-label="Selection actions"
              aria-expanded={!!model.actionMenu}
              className={`
                hover:bg-highlighted/50
                rounded p-2
              `}
              onClick={() => send({ type: 'open-action-menu' })}
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        }
        overlay={
          surface?.portalHost ? createPortal(menu, surface.portalHost) : menu
        }
      >
        <div data-manager-main className="min-h-full p-3">
          {model.notice && (
            <div
              role={model.notice.kind === 'error' ? 'alert' : 'status'}
              className={`
                border-border mb-3 flex items-center justify-between gap-2
                rounded border p-2 text-sm
              `}
            >
              <span>{model.notice.message}</span>
              <button
                aria-label="Dismiss notice"
                onClick={() => send({ type: 'dismiss-notice' })}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {model.status === 'loading' ? (
            <p role="status" className="text-muted p-4">
              Loading tabs…
            </p>
          ) : model.status === 'error' ? (
            <p role="alert" className="p-4">
              {model.error ?? 'Unable to load tabs.'}
            </p>
          ) : !viewedWindow ? (
            <p className="text-muted p-4">Create a window to get started.</p>
          ) : (
            <>
              <h2 className="text-muted mb-3 px-1 text-xs font-medium">
                {viewedWindow.title} · {viewedWindow.tabs.length} tabs
              </h2>
              <BrowserTabList
                items={items}
                selectedTabIds={new Set(model.selectedTabIds)}
                selectedGroupIds={new Set(model.selectedGroupIds)}
                isMultiSelectMode={model.selectionMode === 'multi-select'}
                onTabClick={(tab, event) =>
                  select({ type: 'tab', id: Number(tab.id) }, event)
                }
                onTabClose={(tab) =>
                  send({ type: 'close-tabs', tabIds: [Number(tab.id)] })
                }
                onGroupSelect={(group, event) =>
                  select({ type: 'group', id: Number(group.id) }, event)
                }
                onGroupToggleCollapse={(group) =>
                  send({
                    type: 'set-group-collapsed',
                    groupId: Number(group.id),
                    collapsed: !group.collapsed,
                  })
                }
                renderTabItem={({
                  tab,
                  selected,
                  duplicate,
                  isMultiSelectMode,
                  onClick,
                  onClose,
                }) => (
                  <BrowserTabItem
                    title={tab.title}
                    url={tab.url}
                    favicon={tab.favicon}
                    active={tab.active}
                    loading={tab.loading}
                    pinned={tab.pinned}
                    discarded={tab.discarded}
                    audio={tab.audio}
                    ageLabel={tab.ageLabel}
                    tabId={tab.id}
                    selected={selected}
                    duplicate={duplicate}
                    isMultiSelectMode={isMultiSelectMode}
                    onClick={onClick}
                    onClose={onClose}
                    onDoubleClick={() =>
                      send({ type: 'activate-tab', tabId: Number(tab.id) })
                    }
                    {...cues({ type: 'tab', id: Number(tab.id) })}
                  />
                )}
                renderGroupItem={({
                  group,
                  selected,
                  isMultiSelectMode,
                  onSelect,
                  onToggleCollapse,
                  children,
                }) => (
                  <BrowserTabGroupItem
                    groupId={group.id}
                    title={group.title}
                    color={group.color}
                    collapsed={group.collapsed}
                    selected={selected}
                    isMultiSelectMode={isMultiSelectMode}
                    onSelect={onSelect}
                    onToggleCollapse={onToggleCollapse}
                    {...cues({ type: 'group', id: Number(group.id) })}
                  >
                    {children}
                  </BrowserTabGroupItem>
                )}
              />
            </>
          )}
        </div>
      </TabManagerShell>
    </div>
  )
}
