import { t } from '@extension/i18n/catalog'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { BrowserTabGroupItem } from '../BrowserTabGroupItem'
import { BrowserTabList } from '../BrowserTabList'
import { TabListSkeleton } from '../components/TabListSkeleton'
import { useSurface, useSurfaceInputOwner } from '../Surface'
import {
  useShouldReduceMotion,
  useShouldSettleMotion,
} from '../useShouldReduceMotion'
import { ModeTransitionEffect } from './ui/ModeTransitionEffect'
import { TabManagerActionBar } from './ui/TabManagerActionBar'
import { TabManagerDesignPicker } from './ui/TabManagerDesignPicker'
import { TabManagerShell } from './ui/TabManagerShell'
import {
  WindowHeader,
  WindowIdentityEditor,
  WindowPicker,
} from './ui/WindowNavigation'
import { useTabDrag } from './useTabDrag'
import type {
  BrowserTabListItemData,
  BrowserTabListTab,
} from '../BrowserTabList'
import type {
  TabManagerContrast,
  TabManagerDesign,
} from './ui/TabManagerDesignPicker'
import type {
  BrowserTabGroupColor,
  SelectionItemRef,
  TabPlacement,
} from '@extension/core'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'

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
  name?: string
  icon?: string
  iconUrl?: string
  iconColor?: BrowserTabGroupColor
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
  windowIconColor?: BrowserTabGroupColor
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
  windowSource?: 'active' | 'first'
  windowPicker?: boolean
  editingWindow?: {
    windowId: number
    useCustom?: boolean
    name: string
    icon?: string
    iconColor?: BrowserTabGroupColor
  } | null
  actions?: TabManagerAction[]
  contextActions?: TabManagerAction[]
  actionPanel?: { actionId: string } | null
  renamingGroupId?: number | null
  renamingGroupTitle?: string | null
  duplicateTabIds?: number[]
  viewedWindowId: number | null
  selectedTabIds: number[]
  selectedGroupIds: number[]
  selectionMode: 'default' | 'multi-select'
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
  scrollToItem?: { id: number; revision: number; focus?: boolean } | null
}
export type TabManagerIntent =
  | {
      type: 'place-tabs'
      tabIds: number[]
      destination?: TabPlacement
      windowId?: number
      scrollTop?: number
    }
  | { type: 'receive-moved-tabs'; windowId: number; tabIds: readonly number[] }
  | { type: 'view-window'; windowId: number }
  | { type: 'open-window-picker' }
  | { type: 'dismiss-window-picker' }
  | { type: 'edit-window' }
  | {
      type: 'change-window-draft'
      value: { name?: string; icon?: string; iconColor?: BrowserTabGroupColor }
    }
  | { type: 'save-window' }
  | { type: 'cancel-window-edit' }
  | { type: 'reset-window' }
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
  | { type: 'focus-creation'; pane: 'window' | 'tab' }
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
  appearanceExperiment?: boolean
  designSettings?: ReactNode
}

const navigationSelector =
  '[data-nav-type="window"], [data-tab-option], [data-group-option], [data-create-item]'
const controlSelector = 'button,summary,[data-tab-option],[data-group-option]'
const sectionOrder = ['header', 'tabs', 'actions', 'tools']

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

const PaneTransition = ({
  children,
  onReady,
}: {
  children: React.ReactNode
  onReady: () => void
}) => {
  const present = useIsPresent()
  const reduced = useShouldReduceMotion()
  const settleList = useShouldSettleMotion()
  const settle = reduced || settleList
  useLayoutEffect(onReady, [onReady])
  return (
    <motion.div
      inert={!present}
      initial={{ opacity: settle ? 1 : 0, y: settle ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: settle ? 0 : -4 }}
      transition={{ duration: settle ? 0 : 0.1, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

/** Complete controlled presentation; behavior and external effects are supplied by its host. */
export const TabManager = ({
  model,
  onIntent,
  className,
  focusOnMount = false,
  appearanceExperiment = false,
  designSettings,
}: TabManagerProps) => {
  const [design, setDesign] = useState<TabManagerDesign>('refined')
  const [contrast, setContrast] = useState<TabManagerContrast>('balanced')
  const surface = useSurface()
  const { canFocusInput } = useSurfaceInputOwner()
  const rootRef = useRef<HTMLDivElement>(null)
  const initialFocusApplied = useRef(false)
  const pendingKeyboardFocus = useRef(false)
  const pendingCreatedFocus = useRef<{
    type: 'window' | 'tab'
    knownIds: Set<number>
  } | null>(null)
  const pendingMenuFocus = useRef(false)
  const pendingPaneFocus = useRef<string | null>(null)
  const physicalFocusOwner = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuPosition = useRef<{ x: number; y: number } | null>(null)
  const menuReturnFocus = useRef<HTMLElement | null>(null)
  const live = !surface || surface.inputMode === 'live'
  const drag = useTabDrag(rootRef, model, onIntent, live)
  const restoreDrag = drag.restore
  const viewedWindow = model.windows.find(
    (window) => window.id === model.viewedWindowId,
  )
  const selectedTabIds = new Set(model.selectedTabIds)
  const pickerVisible = drag.view
    ? drag.view.mode === 'windows'
    : !!model.windowPicker
  const previousPane = useRef({
    picker: pickerVisible,
    editing: !!model.editingWindow,
    windowId: model.viewedWindowId,
  })
  const focusPane = useCallback(() => {
    if (!live || !canFocusInput() || !pendingPaneFocus.current) return
    const document = rootRef.current?.ownerDocument
    const active = document?.activeElement
    if (
      active !== document?.body &&
      !rootRef.current?.contains(active ?? null) &&
      !surface?.portalHost?.contains(active ?? null)
    ) {
      pendingPaneFocus.current = null
      return
    }
    const target = rootRef.current?.querySelector<HTMLElement>(
      pendingPaneFocus.current,
    )
    if (target) {
      target.focus({ preventScroll: true })
      pendingPaneFocus.current = null
    }
  }, [live, canFocusInput, surface?.portalHost])
  useLayoutEffect(() => {
    const previous = previousPane.current
    previousPane.current = {
      picker: pickerVisible,
      editing: !!model.editingWindow,
      windowId: model.viewedWindowId,
    }
    if (
      !live ||
      drag.view ||
      pickerVisible ||
      model.editingWindow ||
      !canFocusInput()
    )
      return
    if (
      previous.picker ||
      previous.editing ||
      previous.windowId !== model.viewedWindowId
    ) {
      const item = model.focusedItem
      pendingPaneFocus.current =
        previous.windowId !== model.viewedWindowId
          ? item?.type === 'tab'
            ? `[data-tab-id="${item.id}"] [data-tab-option]`
            : item?.type === 'group'
              ? `[data-group-id="${item.id}"] [data-group-option]`
              : '[data-window-picker-trigger]'
          : previous.editing
            ? '[data-window-edit-trigger]'
            : '[data-window-picker-trigger]'
      focusPane()
    }
  }, [
    live,
    pickerVisible,
    model.editingWindow,
    drag.view,
    model.viewedWindowId,
    model.focusedItem,
    focusPane,
    canFocusInput,
  ])
  const send = useCallback(
    (intent: TabManagerIntent) => {
      if (!live) return
      if (
        intent.type === 'open-action-menu' ||
        (intent.type === 'navigate' &&
          (intent.key === 'ContextMenu' ||
            (intent.shift && ['F10', 'Enter'].includes(intent.key))))
      ) {
        pendingMenuFocus.current = true
        const active = rootRef.current?.ownerDocument.activeElement
        if (
          active instanceof HTMLElement &&
          active !== active.ownerDocument.body &&
          !menuRef.current?.contains(active)
        )
          menuReturnFocus.current = active
      }
      void onIntent(intent)
    },
    [live, onIntent],
  )
  const actionBarIntent = useCallback(
    (intent: TabManagerIntent) => {
      if (intent.type === 'open-action-menu') menuPosition.current = null
      send(intent)
    },
    [send],
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
      if (event.shiftKey || event.metaKey || event.ctrlKey)
        select({ type: 'tab', id: Number(tab.id) }, event)
      else send({ type: 'activate-tab', tabId: Number(tab.id) })
    },
    [select, send],
  )
  const onTabActivate = useCallback(
    (tab: BrowserTabListTab) =>
      send({ type: 'activate-tab', tabId: Number(tab.id) }),
    [send],
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
      '[data-window-picker-trigger]',
    )
    if (!currentWindow) return
    initialFocusApplied.current = true
    currentWindow.focus({ preventScroll: true })
  }, [focusOnMount, live, model.status, model.viewedWindowId])
  const syncScroll = useCallback(() => {
    if (drag.view && !pickerVisible) return
    const viewport = rootRef.current?.querySelector<HTMLElement>(
      '[data-manager-scroll] [data-radix-scroll-area-viewport]',
    )
    if (!viewport) return
    if (pickerVisible) {
      const current = viewport.querySelector<HTMLElement>(
        '[data-window-choice][aria-current="true"]',
      )
      if (current)
        viewport.scrollTop +=
          current.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top -
          (viewport.clientHeight - current.clientHeight) / 2
    } else viewport.scrollTop = model.editingWindow ? 0 : (model.scrollTop ?? 0)
  }, [model.scrollTop, pickerVisible, model.editingWindow, drag.view])
  const revealedItem = useRef<TabManagerViewModel['scrollToItem']>(null)
  const revealFrame = useRef(0)
  const revealItem = useCallback(() => {
    const request = model.scrollToItem
    if (
      !live ||
      drag.view ||
      pickerVisible ||
      !request ||
      (revealedItem.current?.id === request.id &&
        revealedItem.current.revision === request.revision)
    )
      return
    const target = rootRef.current?.querySelector<HTMLElement>(
      `[data-tab-id="${request.id}"]`,
    )
    if (!target) return
    revealedItem.current = request
    target.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    })
    if (request.focus && canFocusInput())
      target
        .querySelector<HTMLElement>('[data-tab-option]')
        ?.focus({ preventScroll: true })
  }, [model.scrollToItem, live, drag.view, pickerVisible, canFocusInput])
  const queueReveal = useCallback(() => {
    cancelAnimationFrame(revealFrame.current)
    revealFrame.current = requestAnimationFrame(revealItem)
  }, [revealItem])
  const paneReady = useCallback(() => {
    syncScroll()
    focusPane()
    restoreDrag()
    queueReveal()
  }, [syncScroll, focusPane, restoreDrag, queueReveal])
  useLayoutEffect(syncScroll, [syncScroll])
  useLayoutEffect(() => {
    queueReveal()
    return () => cancelAnimationFrame(revealFrame.current)
  }, [queueReveal])
  useLayoutEffect(() => {
    if (!live) return
    const focusModelItem = () => {
      const item = model.focusedItem
      const selector = pickerVisible
        ? '[data-window-choice][aria-current="true"], [data-window-choice]'
        : !item
          ? '[data-window-picker-trigger]'
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
    pickerVisible,
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
  const navigationEntries = (section: Element | null | undefined) =>
    Array.from(
      section?.querySelectorAll<HTMLElement>(navigationSelector) ?? [],
    ).filter(
      (entry) =>
        !entry.closest('[inert],[aria-hidden="true"]') &&
        (entry.matches('[data-group-option]') ||
          !entry.closest('[data-group-id][data-collapsed="true"]')),
    )
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!live || pickerVisible || model.editingWindow || !canFocusInput())
      return
    const target = event.target as HTMLElement
    if (target.closest('input,textarea,select,[contenteditable="true"]')) return
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      event.stopPropagation()
      send({ type: 'navigate', key: 'a', toggle: true })
      return
    }
    if (target.closest('[role="menu"]')) return
    const section = target.closest<HTMLElement>('[data-keyboard-section]')
    if (
      event.key === 'Tab' &&
      section?.dataset.keyboardSection === 'tabs' &&
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
        focusControl(entry)
      }
      return
    }
    if (
      section &&
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ].includes(event.key) &&
      !event.altKey &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const list = section.dataset.keyboardSection === 'tabs'
      const horizontal = ['ArrowLeft', 'ArrowRight'].includes(event.key)
      const entries = list
        ? navigationEntries(section)
        : sectionControls(section)
      const current = entries.findIndex(
        (entry) =>
          entry === target ||
          entry.contains(target) ||
          sameItem(itemAt(entry), itemAt(target)),
      )
      let crossing: HTMLElement | null | undefined
      if (list && event.key === 'ArrowUp' && current === 0)
        crossing = rootRef.current?.querySelector<HTMLElement>(
          '[data-window-picker-trigger]',
        )
      else if (
        list &&
        event.key === 'ArrowDown' &&
        current === entries.length - 1
      )
        crossing = rootRef.current?.querySelector<HTMLElement>(
          '[data-keyboard-section="tools"] button',
        )
      else if (!list) {
        const tabs = navigationEntries(
          rootRef.current?.querySelector('[data-keyboard-section="tabs"]'),
        )
        if (
          event.key === 'ArrowUp' &&
          section.dataset.keyboardSection === 'tools'
        )
          crossing = tabs.at(-1)
        else if (
          event.key === 'ArrowDown' &&
          section.dataset.keyboardSection === 'header'
        )
          crossing = tabs[0]
      }
      if (crossing) {
        event.preventDefault()
        event.stopPropagation()
        focusControl(crossing)
        return
      }
      if (list && horizontal) return
      if (!list && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? entries.length - 1
            : horizontal
              ? (current +
                  (event.key === 'ArrowLeft' ? -1 : 1) +
                  entries.length) %
                entries.length
              : Math.max(
                  0,
                  Math.min(
                    entries.length - 1,
                    current + (event.key === 'ArrowUp' ? -1 : 1),
                  ),
                )
      const destination = entries[next]
      if (destination) {
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
    const leavesCreation =
      target.matches('[data-create-item]') &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    if (
      !item &&
      event.key !== 'Escape' &&
      !leavesCreation &&
      !((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a')
    )
      return
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
      const bounds = target.getBoundingClientRect()
      menuPosition.current = { x: bounds.left, y: bounds.bottom }
      pendingMenuFocus.current = true
      pendingKeyboardFocus.current = false
    } else {
      pendingKeyboardFocus.current = event.key !== 'Escape'
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
        group: drag.expanded.includes(group.id)
          ? { ...group, collapsed: false }
          : group,
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
        text-muted flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2
        text-sm transition-colors
        hover:text-foreground hover:bg-highlighted/40
        focus-visible:bg-highlighted/40 focus-visible:ring-accent/70
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
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
      <TabManagerShell>
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
      data-manager-design={
        appearanceExperiment && design !== 'current' ? design : undefined
      }
      data-manager-contrast={appearanceExperiment ? contrast : undefined}
      onFocusCapture={(event) => {
        const target = event.target as HTMLElement
        if (target.matches('[data-create-item]')) {
          pendingKeyboardFocus.current = false
          pendingCreatedFocus.current = null
          send({
            type: 'focus-creation',
            pane: target.dataset.createItem === 'window' ? 'window' : 'tab',
          })
        }
        physicalFocusOwner.current = target.closest(
          '[data-notification-card],[data-manager-action-menu]',
        )
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
        drag.pointerDown(event)
        if (
          event.button === 0 &&
          (model.actionMenu || model.actionPanel) &&
          !menuRef.current?.contains(event.target as Node) &&
          !(event.target as Element).closest(
            '[data-action-bar-menu-trigger],[data-window-edit-trigger],[data-window-picker],[data-manager-action-menu]',
          )
        )
          send({ type: 'dismiss-action-menu' })
      }}
      onContextMenu={(event) => {
        const item = itemAt(event.target)
        if (!item) return
        event.preventDefault()
        const document = event.currentTarget.ownerDocument
        if (live && !document.hasFocus()) document.defaultView?.focus()
        const bounds = (
          surface?.root ?? event.currentTarget
        ).getBoundingClientRect()
        menuPosition.current = {
          x: Math.min(event.clientX + 20, bounds.right - 8),
          y: event.clientY,
        }
        send({ type: 'open-action-menu', target: item })
      }}
      onScrollCapture={(event) => {
        const element = event.target as HTMLElement
        if (
          live &&
          !pickerVisible &&
          !drag.view &&
          !model.editingWindow &&
          element.closest('[data-manager-scroll]')
        )
          send({ type: 'scroll', top: element.scrollTop })
      }}
    >
      <TabManagerShell
        className={className}
        selectionMode={model.selectionMode}
        overlay={
          <>
            <ModeTransitionEffect
              isMultiSelectMode={model.selectionMode === 'multi-select'}
            />
            {drag.overlay}
          </>
        }
        header={
          <WindowHeader
            model={model}
            onIntent={send}
            revealing={drag.revealing === 'windows'}
          />
        }
        actionBar={
          <TabManagerActionBar
            model={model}
            onIntent={actionBarIntent}
            menuRef={menuRef}
            menuPosition={menuPosition}
            returnFocus={menuReturnFocus}
            designPicker={
              appearanceExperiment ? (
                <TabManagerDesignPicker
                  design={design}
                  onDesignChange={setDesign}
                  contrast={contrast}
                  onContrastChange={setContrast}
                  settings={designSettings}
                />
              ) : undefined
            }
          />
        }
      >
        <AnimatePresence initial={false} mode="wait">
          <PaneTransition
            onReady={paneReady}
            key={
              model.editingWindow
                ? 'identity'
                : pickerVisible
                  ? 'windows'
                  : 'tabs'
            }
          >
            <div
              data-manager-main
              data-keyboard-section={
                pickerVisible || model.editingWindow ? undefined : 'tabs'
              }
              className="min-h-full pb-4"
            >
              {model.editingWindow ? (
                <WindowIdentityEditor model={model} onIntent={send} />
              ) : pickerVisible ? (
                <WindowPicker
                  model={model}
                  onIntent={send}
                  dragging={!!drag.view}
                  dropWindowId={drag.dropWindowId}
                />
              ) : model.status === 'error' ? (
                <p role="alert" className="p-4">
                  {model.error ?? 'Unable to load tabs.'}
                </p>
              ) : !viewedWindow ? (
                <p className="text-muted p-4">
                  Create a window to get started.
                </p>
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
                    selectedTabIds={selectedTabIds}
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
                    onTabActivate={onTabActivate}
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
                        dragReveal={drag.revealing === `group-${group.id}`}
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
                        onRenameCancel={() =>
                          send({ type: 'cancel-group-rename' })
                        }
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
          </PaneTransition>
        </AnimatePresence>
      </TabManagerShell>
    </div>
  )
}
