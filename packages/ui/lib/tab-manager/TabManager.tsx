import { t } from '@extension/i18n/catalog'
import { Plus, Search, Settings } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { BrowserTabGroupItem } from '../BrowserTabGroupItem'
import { BrowserTabList } from '../BrowserTabList'
import { Skeleton } from '../components/Skeleton'
import { TabListSkeleton } from '../components/TabListSkeleton'
import { ScrollToActiveIcon } from '../icons'
import { useSurface } from '../Surface'
import { ModeTransitionEffect } from './ui/ModeTransitionEffect'
import { SidebarAction } from './ui/SidebarAction'
import { TabManagerActionBar } from './ui/TabManagerActionBar'
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
  renderKey?: number
  title: string
  url?: string
  faviconUrl?: string
  active?: boolean
  loading?: boolean
  blurred?: boolean
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
  iconUrl?: string
  incognito?: boolean
  active?: boolean
  tabs: TabManagerTabView[]
  groups: TabManagerGroupView[]
}
export type TabManagerActionOption = {
  id: string
  label: string
  subtitle?: string
  icon?: string
  iconUrl?: string
  color?: BrowserTabGroupColor
  disabled?: boolean
  disabledReason?: string
  destructive?: boolean
  dividerBefore?: boolean
}
export type TabManagerAction = {
  id: string
  label: string
  icon: string
  kind: 'primary' | 'secondary'
  disabled?: boolean
  disabledReason?: string
  destructive?: boolean
  shortcut?: string
  panel?: 'windows' | 'groups' | 'colors' | 'copy' | 'actions'
  options?: TabManagerActionOption[]
}
export type TabManagerViewModel = {
  windows: TabManagerWindowView[]
  actions?: TabManagerAction[]
  contextActions?: TabManagerAction[]
  actionPanel?: { actionId: string } | null
  renamingGroupId?: number | null
  renamingGroupTitle?: string | null
  duplicateTabIds?: number[]
  viewedWindowId: number | null
  selectedTabIds: number[]
  selectedGroupIds: number[]
  selectedGroupCount?: number
  selectedWindowIds: number[]
  selectionMode: 'default' | 'multi-select'
  sidebarExpanded: boolean
  compactIconMode?: 'active' | 'first'
  compactLayout?: 'icon' | 'list'
  focusedItem?: TabManagerItem | null
  hoveredItem?: TabManagerItem | null
  actionMenu?: { target?: TabManagerItem } | null
  notifications?: {
    items: { id: number; message: string; kind?: 'info' | 'error' }[]
    expanded: boolean
    paused: boolean
  }
  status?: 'ready' | 'loading' | 'error'
  error?: string
  scrollTop?: number
  scrollToItem?: { id: number; revision: number } | null
}
export type TabManagerIntent =
  | { type: 'view-window'; windowId: number }
  | {
      type: 'select-item'
      item: TabManagerItem
      shift?: boolean
      toggle?: boolean
    }
  | {
      type: 'navigate'
      key: string
      shift?: boolean
      toggle?: boolean
      alt?: boolean
      item?: TabManagerItem
    }
  | { type: 'focus-item'; item: TabManagerItem }
  | { type: 'toggle-sidebar' }
  | { type: 'create-window' }
  | { type: 'create-tab'; windowId: number; groupId?: number }
  | { type: 'run-action'; actionId: string; optionId?: string }
  | { type: 'open-action-panel'; actionId: string }
  | { type: 'dismiss-action-panel' }
  | { type: 'start-group-rename'; groupId: number }
  | { type: 'change-group-rename'; groupId: number; title: string }
  | { type: 'rename-group'; groupId: number; title: string }
  | { type: 'cancel-group-rename' }
  | { type: 'open-search' }
  | { type: 'open-settings' }
  | { type: 'scroll-to-active' }
  | { type: 'toggle-selection-mode' }
  | { type: 'clear-selection' }
  | { type: 'close-tabs'; tabIds: number[] }
  | { type: 'close-item'; item: TabManagerItem }
  | { type: 'close-window'; windowId: number }
  | { type: 'activate-tab'; tabId: number }
  | { type: 'activate-window'; windowId: number }
  | { type: 'set-group-collapsed'; groupId: number; collapsed: boolean }
  | { type: 'open-action-menu'; target?: TabManagerItem }
  | { type: 'dismiss-action-menu' }
  | { type: 'close-selection' }
  | { type: 'dismiss-notice'; id: number }
  | { type: 'expand-notifications'; expanded: boolean }
  | { type: 'scroll'; top: number }
export type TabManagerProps = {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void | Promise<void>
  className?: string
  focusOnMount?: boolean
}

const navigationSelector =
  '[data-nav-type="window"], [data-tab-option], [data-group-option], [data-create-item]'
const controlSelector = 'button,summary,[data-tab-option],[data-group-option]'
const sectionOrder = ['sidebar', 'windows', 'tools', 'tabs', 'actions']

const sameItem = (
  a: TabManagerItem | null | undefined,
  b: TabManagerItem | undefined,
) => !!b && a?.type === b.type && a.id === b.id
const itemAt = (target: EventTarget | null): TabManagerItem | undefined => {
  if (!(target instanceof Element) || target.closest('[data-create-item]'))
    return undefined
  const tab = target.closest<HTMLElement>('[data-tab-id]')
  if (tab) return { type: 'tab', id: Number(tab.dataset.tabId) }
  const group = target.closest<HTMLElement>('[data-group-id]')
  if (group) return { type: 'group', id: Number(group.dataset.groupId) }
  const window = target.closest<HTMLElement>('[data-nav-type="window"]')
  if (window) return { type: 'window', id: Number(window.dataset.navId) }
  return undefined
}

/** Complete controlled presentation; behavior and external effects are supplied by its host. */
export const TabManager = ({
  model,
  onIntent,
  className,
  focusOnMount = false,
}: TabManagerProps) => {
  const surface = useSurface()
  const rootRef = useRef<HTMLDivElement>(null)
  const initialFocusApplied = useRef(false)
  const pendingKeyboardFocus = useRef(false)
  const pendingCreatedFocus = useRef<{
    type: 'window' | 'tab'
    knownIds: Set<number>
  } | null>(null)
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false)
  const pendingMenuFocus = useRef(false)
  const physicalFocusOwner = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const live = !surface || surface.inputMode === 'live'
  const viewedWindow = model.windows.find(
    (window) => window.id === model.viewedWindowId,
  )
  const send = useCallback(
    (intent: TabManagerIntent) => {
      if (!live) return
      if (
        intent.type === 'open-action-menu' ||
        intent.type === 'open-action-panel' ||
        intent.type === 'dismiss-action-panel'
      )
        pendingMenuFocus.current = true
      void onIntent(intent)
    },
    [live, onIntent],
  )
  const cues = (item: TabManagerItem) => ({
    'data-hover': sameItem(model.hoveredItem, item) || undefined,
    'data-focus': sameItem(model.focusedItem, item) || undefined,
  })
  const select = useCallback(
    (item: TabManagerItem, event: MouseEvent) => {
      pendingCreatedFocus.current = null
      pendingKeyboardFocus.current = false
      send({
        type: 'select-item',
        item,
        shift: event.shiftKey,
        toggle: event.metaKey || event.ctrlKey,
      })
    },
    [send],
  )
  const onTabClick = useCallback(
    (tab: BrowserTabListTab, event: MouseEvent<HTMLDivElement>) => {
      select({ type: 'tab', id: Number(tab.id) }, event)
      if (!(event.metaKey || event.ctrlKey || event.shiftKey))
        send({ type: 'activate-tab', tabId: Number(tab.id) })
    },
    [select, send],
  )
  const onTabClose = useCallback(
    (tab: BrowserTabListTab) =>
      send({ type: 'close-item', item: { type: 'tab', id: Number(tab.id) } }),
    [send],
  )

  useLayoutEffect(() => {
    if (
      !focusOnMount ||
      !live ||
      model.status === 'loading' ||
      initialFocusApplied.current
    )
      return
    if (
      document.activeElement !== document.body &&
      !rootRef.current?.contains(document.activeElement)
    )
      return
    const currentWindow = rootRef.current?.querySelector<HTMLElement>(
      `[data-nav-type="window"][data-nav-id="${model.viewedWindowId}"]`,
    )
    if (!currentWindow) return
    initialFocusApplied.current = true
    currentWindow.focus({ preventScroll: true })
  }, [focusOnMount, live, model.status, model.viewedWindowId])
  useLayoutEffect(() => {
    const viewport = rootRef.current?.querySelector<HTMLElement>(
      '[data-manager-scroll] [data-radix-scroll-area-viewport]',
    )
    if (viewport && viewport.scrollTop !== (model.scrollTop ?? 0))
      viewport.scrollTop = model.scrollTop ?? 0
  }, [model.scrollTop, model.viewedWindowId])
  useLayoutEffect(() => {
    if (!live || !model.scrollToItem) return
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-tab-id="${model.scrollToItem.id}"]`)
      ?.scrollIntoView({
        block: 'center',
        behavior: surface?.motion === 'reduced' ? 'instant' : 'smooth',
      })
  }, [model.scrollToItem, surface?.motion, live])
  useLayoutEffect(() => {
    if (!live) return
    const focusModelItem = () => {
      const item = model.focusedItem
      const selector = !item
        ? '[data-nav-type="action"]'
        : item.type === 'tab'
          ? `[data-tab-id="${item.id}"] [data-tab-option]`
          : item.type === 'group'
            ? `[data-group-id="${item.id}"] [data-group-option]`
            : `[data-nav-type="window"][data-nav-id="${item.id}"]`
      const target = rootRef.current?.querySelector<HTMLElement>(selector)
      target?.focus({ preventScroll: true })
      if (pendingKeyboardFocus.current)
        target?.scrollIntoView?.({ block: 'nearest' })
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
    const created = pendingCreatedFocus.current
    const createdReady =
      !created ||
      (model.focusedItem?.type === created.type &&
        !created.knownIds.has(model.focusedItem.id))
    if (pendingKeyboardFocus.current && createdReady) {
      if (rootRef.current?.contains(document.activeElement)) focusModelItem()
      pendingKeyboardFocus.current = false
      pendingCreatedFocus.current = null
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
    model.actionPanel,
    live,
    surface?.portalHost,
  ])

  useLayoutEffect(() => {
    if (
      (!model.actionMenu && !model.actionPanel) ||
      !live ||
      !pendingMenuFocus.current
    )
      return
    pendingMenuFocus.current = false
    menuRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
      ?.focus()
  }, [model.actionMenu, model.actionPanel, live])

  const focusControl = (target: HTMLElement) => {
    pendingCreatedFocus.current = null
    pendingKeyboardFocus.current = false
    target.focus({ preventScroll: true })
    target.scrollIntoView?.({ block: 'nearest' })
    const item = itemAt(target)
    if (item) send({ type: 'focus-item', item })
  }
  const sectionControls = (section: Element) =>
    Array.from(section.querySelectorAll<HTMLElement>(controlSelector)).filter(
      (control) =>
        !control.closest('[inert],[aria-hidden="true"]') &&
        !control.matches(':disabled,[tabindex="-1"]'),
    )
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!live) return
    const target = event.target as HTMLElement
    if (target.closest('input,textarea,[contenteditable="true"],[role="menu"]'))
      return
    if (event.key === 'Escape' && shortcutHelpOpen) {
      event.preventDefault()
      event.stopPropagation()
      setShortcutHelpOpen(false)
      return
    }
    const section = target.closest<HTMLElement>('[data-keyboard-section]')
    if (
      event.key === 'Tab' &&
      section &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const sections = sectionOrder.flatMap((name) => {
        const element = rootRef.current?.querySelector<HTMLElement>(
          `[data-keyboard-section="${name}"]`,
        )
        return element && sectionControls(element).length ? [element] : []
      })
      const next =
        sections[sections.indexOf(section) + (event.shiftKey ? -1 : 1)]
      if (!next) return
      const controls = sectionControls(next)
      const remembered = controls.find((control) =>
        sameItem(model.focusedItem, itemAt(control)),
      )
      const entry =
        remembered ??
        controls.find((control) => control.matches('[data-viewing="true"]')) ??
        controls[0]
      if (entry) {
        event.preventDefault()
        event.stopPropagation()
        setShortcutHelpOpen(false)
        if (
          model.sidebarExpanded &&
          rootRef.current?.querySelector('[data-sidebar-layout="overlay"]') &&
          ['tabs', 'actions'].includes(next.dataset.keyboardSection ?? '')
        )
          send({ type: 'toggle-sidebar' })
        focusControl(entry)
      }
      return
    }
    if (
      section &&
      ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) &&
      !event.altKey &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const list =
        section.dataset.keyboardSection === 'windows' ||
        section.dataset.keyboardSection === 'tabs'
      const entries = list
        ? Array.from(section.querySelectorAll<HTMLElement>(navigationSelector))
        : sectionControls(section)
      const current = entries.findIndex(
        (entry) => entry === target || entry.contains(target),
      )
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? entries.length - 1
            : Math.max(
                0,
                Math.min(
                  entries.length - 1,
                  current + (event.key === 'ArrowUp' ? -1 : 1),
                ),
              )
      const destination = entries[next]
      if (
        destination &&
        (!list ||
          destination.matches('[data-create-item]') ||
          target.matches('[data-create-item]'))
      ) {
        event.preventDefault()
        event.stopPropagation()
        const item = itemAt(destination)
        if (list && item) {
          pendingKeyboardFocus.current = true
          send({ type: 'navigate', key: event.key, item })
        } else focusControl(destination)
        return
      }
    }
    if (
      ![
        'ArrowDown',
        'ArrowUp',
        'ArrowLeft',
        'ArrowRight',
        'ContextMenu',
        'F10',
        'F2',
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
      !control.matches('[data-group-option]')
    )
      return
    const item = target.matches('[data-create-item]')
      ? undefined
      : itemAt(event.target)
    if (!item && event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    if (item && !sameItem(model.focusedItem, item))
      send({ type: 'focus-item', item })
    if (item?.type === 'group' && event.key === 'F2') {
      send({ type: 'start-group-rename', groupId: item.id })
      return
    }
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
    pendingCreatedFocus.current = null
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
      ...(event.altKey ? { alt: true } : {}),
    })
  }

  const toTab = (tab: TabManagerTabView): BrowserTabListTab => ({
    ...tab,
    ageLabel: tab.ageLabel ?? '',
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
  const createTabAction = (groupId?: number) => (
    <button
      type="button"
      data-nav-type="action"
      data-create-item="tab"
      aria-label={
        groupId === undefined
          ? t('tabManager_newTab')
          : t(
              'tabManager_newTabInGroup',
              viewedWindow?.groups.find((group) => group.id === groupId)
                ?.title || 'Untitled group',
            )
      }
      className={`
        text-muted flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2
        text-sm transition-colors
        hover:text-foreground hover:bg-highlighted/40
        focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
        focus-visible:ring-offset-background focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2
      `}
      onClick={() => {
        if (!viewedWindow) return
        pendingKeyboardFocus.current = true
        pendingCreatedFocus.current = {
          type: 'tab',
          knownIds: new Set(
            model.windows.flatMap((window) => window.tabs.map((tab) => tab.id)),
          ),
        }
        send({ type: 'create-tab', windowId: viewedWindow.id, groupId })
      }}
    >
      <Plus className="size-5" aria-hidden="true" />
      <span>{t('tabManager_newTab')}</span>
    </button>
  )
  if (model.status === 'loading')
    return (
      <TabManagerShell
        sidebar={
          <div className="flex h-full flex-col gap-2 p-2">
            {[0, 1, 2].map((id) => (
              <Skeleton key={id} className="h-10 w-10 rounded-lg" />
            ))}
          </div>
        }
      >
        <div role="status" aria-label="Loading tabs">
          <TabListSkeleton count={12} />
        </div>
      </TabManagerShell>
    )
  return (
    <div
      ref={rootRef}
      className="relative h-full min-h-0"
      data-tab-manager
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement
        physicalFocusOwner.current = target.closest('[data-notification-card]')
          ? null
          : target
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
          (model.actionMenu || model.actionPanel) &&
          !menuRef.current?.contains(event.target as Node) &&
          !(event.target as Element).closest('[data-action-bar-menu-trigger]')
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
        overlay={
          <ModeTransitionEffect
            isMultiSelectMode={model.selectionMode === 'multi-select'}
          />
        }
        sidebar={
          <TabManagerSidebar
            isExpanded={model.sidebarExpanded}
            onToggleExpand={() => send({ type: 'toggle-sidebar' })}
            collapseSidebarLabel="Collapse sidebar"
            expandSidebarLabel="Expand sidebar"
            windowCount={model.windows.length}
            windowList={
              <>
                {' '}
                {model.windows.map((window) => (
                  <WindowRailItem
                    key={window.id}
                    id={window.id}
                    title={
                      model.compactIconMode === 'first'
                        ? window.tabs[0]?.title || window.title
                        : window.title
                    }
                    icon={
                      (
                        model.compactIconMode === 'first'
                          ? window.tabs[0]?.faviconUrl
                          : window.iconUrl
                      ) ? (
                        <img
                          src={
                            model.compactIconMode === 'first'
                              ? window.tabs[0]?.faviconUrl
                              : window.iconUrl
                          }
                          width={24}
                          height={24}
                          alt=""
                        />
                      ) : undefined
                    }
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
                <SidebarAction
                  icon={<Plus size={20} />}
                  label={t('tabContextMenu_newWindow')}
                  isExpanded={model.sidebarExpanded}
                  onClick={() => {
                    pendingKeyboardFocus.current = true
                    pendingCreatedFocus.current = {
                      type: 'window',
                      knownIds: new Set(
                        model.windows.map((window) => window.id),
                      ),
                    }
                    send({ type: 'create-window' })
                  }}
                  createItem="window"
                />
              </>
            }
            actions={
              <>
                <SidebarAction
                  icon={<ScrollToActiveIcon size={20} />}
                  label="Scroll to active"
                  isExpanded={model.sidebarExpanded}
                  onClick={() => send({ type: 'scroll-to-active' })}
                />
                <SidebarAction
                  icon={<Search size={20} />}
                  label="Search everything"
                  isExpanded={model.sidebarExpanded}
                  onClick={() => send({ type: 'open-search' })}
                />
                <SidebarAction
                  icon={<Settings size={20} />}
                  label="Settings"
                  isExpanded={model.sidebarExpanded}
                  onClick={() => send({ type: 'open-settings' })}
                />
              </>
            }
          />
        }
        actionBar={
          <TabManagerActionBar
            model={model}
            onIntent={send}
            menuRef={menuRef}
            onShortcutHelp={() => {
              if (!live) return
              send({ type: 'dismiss-action-menu' })
              setShortcutHelpOpen(true)
              rootRef.current
                ?.querySelector<HTMLElement>('[data-action-bar-menu-trigger]')
                ?.focus()
            }}
          />
        }
      >
        <div
          data-manager-main
          data-keyboard-section="tabs"
          className="min-h-full pb-4"
        >
          {model.status === 'error' ? (
            <p role="alert" className="p-4">
              {model.error ?? 'Unable to load tabs.'}
            </p>
          ) : !viewedWindow ? (
            <p className="text-muted p-4">Create a window to get started.</p>
          ) : (
            <div
              key={`window-tabs-${viewedWindow.id}`}
              data-tab-pane
              className="space-y-4 p-2"
            >
              <BrowserTabList
                items={items}
                renamingGroupId={model.renamingGroupId ?? undefined}
                renamingGroupTitle={model.renamingGroupTitle ?? undefined}
                onGroupRenameTitleChange={(group, title) =>
                  send({
                    type: 'change-group-rename',
                    groupId: Number(group.id),
                    title,
                  })
                }
                selectedTabIds={new Set(model.selectedTabIds)}
                selectedGroupIds={new Set(model.selectedGroupIds)}
                duplicateTabIds={new Set(model.duplicateTabIds)}
                isMultiSelectMode={model.selectionMode === 'multi-select'}
                focusedTabId={
                  model.focusedItem?.type === 'tab'
                    ? model.focusedItem.id
                    : undefined
                }
                hoveredTabId={
                  model.hoveredItem?.type === 'tab'
                    ? model.hoveredItem.id
                    : undefined
                }
                onTabClick={onTabClick}
                onTabClose={onTabClose}
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
                    active={viewedWindow.tabs.some(
                      (tab) => tab.groupId === group.id && tab.active,
                    )}
                    isRenaming={model.renamingGroupId === group.id}
                    renameTitle={
                      model.renamingGroupId === group.id
                        ? (model.renamingGroupTitle ?? '')
                        : undefined
                    }
                    onRenameTitleChange={(title) =>
                      send({
                        type: 'change-group-rename',
                        groupId: Number(group.id),
                        title,
                      })
                    }
                    onRenameStart={() =>
                      send({
                        type: 'start-group-rename',
                        groupId: Number(group.id),
                      })
                    }
                    onRenameCancel={() => send({ type: 'cancel-group-rename' })}
                    onRenameComplete={(title) =>
                      send({
                        type: 'rename-group',
                        groupId: Number(group.id),
                        title,
                      })
                    }
                    onClose={() =>
                      send({
                        type: 'close-item',
                        item: { type: 'group', id: Number(group.id) },
                      })
                    }
                    selected={selected}
                    isMultiSelectMode={isMultiSelectMode}
                    onSelect={onSelect}
                    onToggleCollapse={onToggleCollapse}
                    {...cues({ type: 'group', id: Number(group.id) })}
                  >
                    {children}
                    {!group.collapsed && (
                      <div className="pl-2">
                        {createTabAction(Number(group.id))}
                      </div>
                    )}
                  </BrowserTabGroupItem>
                )}
              />
              {createTabAction()}
            </div>
          )}
        </div>
      </TabManagerShell>
      {shortcutHelpOpen && (
        <section
          aria-label="Keyboard shortcuts"
          className={`
            bg-popover text-popover-foreground border-border absolute bottom-16
            left-16 right-2 z-[80] max-h-[75%] overflow-y-auto rounded-lg border
            p-4 text-sm shadow-lg
          `}
        >
          <h2 className="mb-3 font-semibold">Keyboard shortcuts</h2>
          <dl className="space-y-2">
            {[
              ['Tab / Shift+Tab', 'Next / previous section'],
              ['↑ / ↓ · Home / End', 'Navigate items and creation actions'],
              ['← / →', 'Move between windows and tabs'],
              ['Enter', 'Open a tab or window; collapse or expand a group'],
              ['Space', 'Toggle selection; activate a creation action'],
              ['Shift+↑ / ↓', 'Extend selection'],
              ['Cmd / Ctrl+A', 'Select all items in the current list'],
              ['Delete / Backspace', 'Close the selection or focused item'],
              ['Menu / Shift+Enter / Shift+F10', 'Open selection actions'],
              ['Alt+↑ / ↓', 'Reorder the focused tab or group'],
              ['F2', 'Rename the focused group'],
              ['Escape', 'Clear selection or dismiss help / menus'],
            ].map(([keys, description]) => (
              <div key={keys}>
                <dt className="font-medium">{keys}</dt>
                <dd className="text-muted">{description}</dd>
              </div>
            ))}
          </dl>
          <p className="text-muted mt-3 text-xs">
            Section order: sidebar controls, windows, tools, tabs, actions. At
            either end, Tab continues outside the manager. Creation actions
            follow their list’s items.
          </p>
        </section>
      )}
    </div>
  )
}
