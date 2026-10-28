import {
  bookmarkLabel,
  bookmarkSelectionRoots,
  canEditBookmark,
  decodeBookmarkGroup,
  directBookmarkSelection,
  encodeBookmarkGroup,
  flattenBookmarks,
} from '@extension/core/bookmarks'
import { isNavigableUrl } from '@extension/core/navigation'
import {
  emptyListSelection,
  reduceListSelection,
} from '@extension/core/selection/ListSelection'
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BrowserTabItem, tabRowHeightClass } from '../BrowserTabItem'
import { useSurface, useSurfaceInputOwner } from '../Surface'
import { getGroupColorClasses } from '../tab-group/tabGroupColors'
import { TabList } from '../TabList'
import { cn } from '../utils/cn'
import { bookmarkControlClass, BookmarkEditor } from './BookmarkEditor'
import { moveControlFocus } from './ui/managerKeyboard'
import { TabManagerActionBar } from './ui/TabManagerActionBar'
import { TabManagerShell } from './ui/TabManagerShell'
import type {
  BookmarkEditCommand,
  BookmarkEditorRequest,
} from './BookmarkEditor'
import type {
  TabManagerAction,
  TabManagerIntent,
  TabManagerViewModel,
  TabManagerWindowView,
} from './TabManager'
import type {
  BookmarkNode,
  BookmarkResource,
  BookmarkSnapshot,
} from '@extension/core/bookmarks'
import type { ListSelectionIntent } from '@extension/core/selection/ListSelection'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'

const itemCount = (count: number) =>
  `${count} ${count === 1 ? 'item' : 'items'}`

export const BookmarkManager = ({
  snapshot,
  actions,
  windows,
  windowId,
  currentWindowId,
  navigation,
  onSearch,
  onSettings,
}: {
  snapshot: BookmarkSnapshot
  actions: BookmarkResource
  windows: TabManagerWindowView[]
  windowId: number | null
  currentWindowId?: number
  navigation: ReactNode
  onSearch: () => void
  onSettings: () => void
}) => {
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState(emptyListSelection)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ ids: string[] } | null>(null)
  const [panel, setPanel] = useState<string | null>(null)
  const [editor, setEditor] = useState<BookmarkEditorRequest | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{
    text: string
    error?: boolean
  } | null>(null)
  const [expandedNotice, setExpandedNotice] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuPosition = useRef<{ x: number; y: number } | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const hadEditor = useRef(false)
  const physicalRowFocus = useRef<HTMLElement | null>(null)
  const previousOrder = useRef<string[]>([])
  const surface = useSurface()
  const { canFocusInput } = useSurfaceInputOwner()
  const { nodes, byId, paths, folderLabels } = useMemo(() => {
    const nodes = flattenBookmarks(snapshot.roots)
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const paths = new Map<string, string>()
    const pathFor = (node: BookmarkNode): string => {
      const cached = paths.get(node.id)
      if (cached !== undefined) return cached
      const parent = node.parentId ? byId.get(node.parentId) : undefined
      const path = `${parent && parent.id !== '0' ? `${pathFor(parent)} / ` : ''}${bookmarkLabel(node) || 'Untitled folder'}`
      paths.set(node.id, path)
      return path
    }
    const counts = new Map<string, number>()
    const ordinals = new Map<string, number>()
    for (const node of nodes) {
      const path = pathFor(node)
      if (node.url !== undefined) continue
      const count = (counts.get(path) ?? 0) + 1
      counts.set(path, count)
      ordinals.set(node.id, count)
    }
    const folderLabels = new Map(
      nodes
        .filter((node) => node.url === undefined)
        .map((node) => {
          const path = paths.get(node.id)!
          return [
            node.id,
            `${path}${counts.get(path)! > 1 ? ` (${ordinals.get(node.id)})` : ''}`,
          ]
        }),
    )
    return { nodes, byId, paths, folderLabels }
  }, [snapshot.roots])
  const folder = byId.get(snapshot.folderId) ?? snapshot.roots[0]
  const items = useMemo(
    () =>
      query.trim()
        ? nodes.filter(
            (node) =>
              node.id !== '0' &&
              `${bookmarkLabel(node)} ${node.url ?? ''}`
                .toLocaleLowerCase()
                .includes(query.trim().toLocaleLowerCase()),
          )
        : (folder?.children ?? []),
    [query, nodes, folder],
  )
  const order = useMemo(() => items.map((node) => node.id), [items])
  useLayoutEffect(() => {
    const focused = physicalRowFocus.current
    if (
      focused &&
      !focused.isConnected &&
      focused.ownerDocument.activeElement === focused.ownerDocument.body &&
      canFocusInput()
    ) {
      const index = previousOrder.current.indexOf(focusedId ?? '')
      const options =
        listRef.current?.querySelectorAll<HTMLElement>('[data-tab-option]')
      const target =
        options?.[Math.max(0, Math.min(index, options.length - 1))] ??
        listRef.current?.querySelector<HTMLElement>('[data-create-item]')
      target?.focus({ preventScroll: true })
    }
    previousOrder.current = order
  }, [order, focusedId, canFocusInput])
  const selectedIds = new Set(selection.ids)
  const selected = items.filter((node) => selectedIds.has(node.id))
  const targets = menu ? menu.ids.flatMap((id) => byId.get(id) ?? []) : selected
  const targetIds = targets.map((node) => node.id)
  const targetWindowId = currentWindowId ?? windowId
  useLayoutEffect(() => {
    const restore = hadEditor.current && !editor
    hadEditor.current = !!editor
    if (restore && canFocusInput()) {
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : listRef.current?.querySelector<HTMLElement>('[data-tab-option]')
      target?.focus({ preventScroll: true })
    }
  }, [editor, canFocusInput])
  const select = (intent: ListSelectionIntent) =>
    setSelection((current) => reduceListSelection(current, intent, order))
  const closeMenu = () => {
    setMenu(null)
    setPanel(null)
  }
  const run = async (action: () => Promise<string | void>) => {
    if (busy) return false
    setBusy(true)
    setNotice(null)
    closeMenu()
    try {
      const text = await action()
      if (text) setNotice({ text })
      return true
    } catch (error) {
      setNotice({
        text: error instanceof Error ? error.message : String(error),
        error: true,
      })
      return false
    } finally {
      setBusy(false)
    }
  }
  const navigate = async (id: string) => {
    if (await run(() => actions.selectFolder(id))) {
      setQuery('')
      setSelection(emptyListSelection())
      setFocusedId(null)
      setEditor(null)
      if (canFocusInput()) listRef.current?.focus()
    }
  }
  const begin = (
    kind: BookmarkEditorRequest['kind'],
    ids: string[] = targetIds,
  ) => {
    closeMenu()
    setNotice(null)
    setEditor({
      kind,
      ids: ['edit', 'move', 'delete'].includes(kind) ? ids : [],
    })
  }
  const batchMutation = async (
    ids: string[],
    verb: 'Moved' | 'Deleted',
    operation: (node: BookmarkNode) => Promise<void>,
  ) => {
    if (ids.some((id) => !byId.has(id)))
      throw new Error(
        'A selected item no longer exists. Select the remaining items again.',
      )
    const roots = bookmarkSelectionRoots(nodes, ids)
    if (!roots.length || roots.some((node) => !canEditBookmark(node)))
      throw new Error(
        'Chrome manages one or more selected items. They cannot be changed.',
      )
    let succeeded = 0
    const failures: string[] = []
    for (const node of roots) {
      try {
        await operation(node)
        succeeded++
      } catch (error) {
        failures.push(
          `${bookmarkLabel(node) || 'Untitled'}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
    if (failures.length) {
      if (succeeded) setEditor(null)
      throw new Error(
        `${verb} ${succeeded} of ${roots.length} items. ${failures[0]}`,
      )
    }
    return `${verb} ${succeeded} ${succeeded === 1 ? 'item' : 'items'}.`
  }
  const submit = async (command: BookmarkEditCommand) => {
    const ok = await run(async () => {
      const { kind, ids, title, url, parentId, index } = command
      if (kind === 'save')
        return actions.saveWindow(
          command.windowId,
          parentId,
          command.newFolder ? title : undefined,
        )
      if (kind === 'delete')
        return batchMutation(ids, 'Deleted', (node) => actions.remove(node.id))
      if (kind === 'move') {
        const roots = bookmarkSelectionRoots(nodes, ids)
        const excluded = new Set(roots.map((node) => node.id))
        const children = (byId.get(parentId)?.children ?? []).filter(
          (node) => !excluded.has(node.id),
        )
        const anchor = index === undefined ? undefined : children[index]?.id
        return batchMutation(ids, 'Moved', async (node) => {
          const current =
            flattenBookmarks(actions.getSnapshot().roots).find(
              (item) => item.id === parentId,
            )?.children ?? []
          const before = anchor
            ? current.findIndex((item) => item.id === anchor)
            : -1
          const previous = current.findIndex((item) => item.id === node.id)
          const insertion =
            before < 0
              ? undefined
              : before - (previous >= 0 && previous < before ? 1 : 0)
          await actions.move(node.id, parentId, insertion)
        })
      }
      if (kind === 'edit') {
        const node = byId.get(ids[0]!)
        if (!node) throw new Error('This bookmark item no longer exists.')
        const group = decodeBookmarkGroup(node.title)
        await actions.update(
          node.id,
          group ? encodeBookmarkGroup({ ...group, title }) : title,
          node.url === undefined ? undefined : url,
        )
      } else
        await actions.create(
          parentId,
          title,
          kind === 'bookmark' ? url : undefined,
        )
      return kind === 'edit'
        ? 'Saved changes.'
        : kind === 'folder'
          ? 'Created folder.'
          : 'Created bookmark.'
    })
    if (ok) setEditor(null)
  }
  const showMenu = (node?: BookmarkNode, event?: MouseEvent) => {
    if (busy) return
    const ids = node
      ? selectedIds.has(node.id) && selected.some((item) => item.id === node.id)
        ? selected.map((item) => item.id)
        : [node.id]
      : selected.map((node) => node.id)
    if (
      node &&
      !selectedIds.has(node.id) &&
      items.some((item) => item.id === node.id)
    )
      select({ type: 'click', id: node.id })
    if (event) {
      const bounds = (surface?.root ?? rootRef.current)?.getBoundingClientRect()
      menuPosition.current = {
        x: Math.min(
          event.clientX + 20,
          (bounds?.right ?? event.clientX + 28) - 8,
        ),
        y: event.clientY,
      }
      returnFocus.current =
        (event.target as HTMLElement)
          .closest('[data-bookmark-id]')
          ?.querySelector<HTMLElement>('[data-tab-option]') ??
        (event.currentTarget as HTMLElement)
    } else {
      const active = rootRef.current?.ownerDocument.activeElement
      if (active instanceof HTMLElement && !menuRef.current?.contains(active))
        returnFocus.current = active
      menuPosition.current = null
    }
    setMenu({ ids })
    setPanel(null)
  }
  const candidates = directBookmarkSelection(targets)
  const single = targets.length === 1 ? targets[0] : undefined
  const editable = targets.length > 0 && targets.every(canEditBookmark)
  const catalog: TabManagerAction[] = []
  const add = (action: TabManagerAction) => catalog.push(action)
  if (single?.url !== undefined)
    add({
      id: 'activate',
      label: 'Open bookmark',
      icon: 'ExternalLink',
      kind: 'primary',
      disabled: !isNavigableUrl(single.url),
      disabledReason: !isNavigableUrl(single.url)
        ? 'This address cannot be opened by Tabby.'
        : undefined,
    })
  if (targets.length)
    add({
      id: 'open',
      label: `Open ${candidates.length} ${candidates.length === 1 ? 'bookmark' : 'bookmarks'} in`,
      icon: 'ExternalLink',
      kind: 'primary',
      panel: 'actions',
      disabled: !candidates.length,
      options: [
        { id: 'tabs', label: 'New tabs in this window', icon: 'Plus' },
        { id: 'window', label: 'A new window', icon: 'MonitorUp' },
        { id: 'group', label: 'A new group in this window', icon: 'Layers' },
      ],
    })
  if (single?.url === undefined && single) {
    const hasBookmarks = flattenBookmarks(single.children ?? []).some(
      (node) => node.url !== undefined,
    )
    add({
      id: 'structure',
      label: 'Open folder structure as windows and groups',
      icon: 'MonitorUp',
      kind: 'primary',
      disabled: !hasBookmarks,
    })
    add({
      id: 'restore',
      label: 'Restore as one window',
      icon: 'RefreshCw',
      kind: 'primary',
      disabled: !hasBookmarks,
    })
  }
  if (single)
    add({
      id: 'edit',
      label: single.url === undefined ? 'Rename folder' : 'Edit bookmark',
      icon: 'Pencil',
      kind: 'secondary',
      disabled: !editable,
      disabledReason: !editable ? 'Chrome manages this item.' : undefined,
    })
  if (targets.length) {
    add({
      id: 'move',
      label:
        targets.length === 1
          ? 'Move or reorder'
          : `Move ${targets.length} items`,
      icon: 'ArrowDown',
      kind: 'secondary',
      disabled: !editable,
      disabledReason: !editable
        ? 'Chrome manages one or more selected items.'
        : undefined,
    })
    add({
      id: 'delete',
      label:
        targets.length === 1
          ? single?.url === undefined
            ? 'Delete folder and contents'
            : 'Delete bookmark'
          : `Delete ${targets.length} items`,
      icon: 'Trash2',
      kind: 'secondary',
      destructive: true,
      disabled: !editable,
      disabledReason: !editable
        ? 'Chrome manages one or more selected items.'
        : undefined,
    })
  }
  add({
    id: 'new',
    label: 'New',
    icon: 'Plus',
    kind: 'secondary',
    panel: 'actions',
    options: [
      { id: 'bookmark', label: 'New bookmark', icon: 'FileText' },
      { id: 'folder', label: 'New folder', icon: 'FolderPlus' },
      {
        id: 'save',
        label: 'Bookmark a window',
        icon: 'MonitorUp',
        disabled: !windows.length,
      },
    ],
  })
  if (items.length)
    add({
      id: 'select-all',
      label: `Select all ${itemCount(items.length)}`,
      icon: 'Layers',
      kind: 'secondary',
    })
  if (selected.length)
    add({ id: 'clear', label: 'Clear selection', icon: 'X', kind: 'secondary' })
  const menuModel: TabManagerViewModel = {
    windows,
    viewedWindowId: windowId,
    selectedTabIds: [],
    selectedGroupIds: [],
    selectionMode: selection.mode,
    actions: catalog,
    actionMenu: menu ? {} : null,
    actionPanel: panel ? { actionId: panel } : null,
    notifications: {
      items: notice
        ? [
            {
              id: 1,
              message: notice.text,
              kind: notice.error ? 'error' : 'info',
            },
          ]
        : [],
      expanded: expandedNotice,
      paused: false,
    },
  }
  const menuIntent = (intent: TabManagerIntent) => {
    if (intent.type === 'dismiss-notice') {
      setNotice(null)
      return
    }
    if (intent.type === 'expand-notifications') {
      setExpandedNotice(intent.expanded)
      return
    }
    if (busy) return
    if (intent.type === 'open-search') {
      onSearch()
      return
    }
    if (intent.type === 'open-settings') {
      onSettings()
      return
    }
    if (intent.type === 'open-action-menu') {
      showMenu()
      return
    }
    if (intent.type === 'dismiss-action-menu') {
      closeMenu()
      return
    }
    if (intent.type === 'open-action-panel') {
      setPanel(intent.actionId)
      return
    }
    if (intent.type === 'dismiss-action-panel') {
      setPanel(null)
      return
    }
    if (intent.type !== 'run-action') return
    const id = intent.actionId
    if (id === 'new') {
      begin(intent.optionId as 'bookmark' | 'folder' | 'save')
      return
    }
    if (id === 'select-all') {
      select({ type: 'select-all' })
      closeMenu()
      return
    }
    if (id === 'clear') {
      setSelection(emptyListSelection())
      closeMenu()
      return
    }
    if (['edit', 'move', 'delete'].includes(id)) {
      begin(id as 'edit' | 'move' | 'delete')
      return
    }
    if (targetWindowId === null || targetWindowId === undefined) return
    if (id === 'activate' && single)
      void run(() => actions.open(single.id, targetWindowId))
    if (id === 'open')
      void run(() =>
        actions.openItems(
          targetIds,
          intent.optionId as 'tabs' | 'window' | 'group',
          targetWindowId,
        ),
      )
    if ((id === 'structure' || id === 'restore') && single)
      void run(() => actions.openFolder(single.id, id, targetWindowId))
  }
  const activate = (node: BookmarkNode) => {
    if (busy) return
    if (node.url === undefined) void navigate(node.id)
    else if (targetWindowId !== null && targetWindowId !== undefined)
      void run(() => actions.open(node.id, targetWindowId))
  }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (
      busy ||
      target.closest(
        'input,textarea,select,[role="menu"],[data-bookmark-editor]',
      )
    )
      return
    const row = target.closest<HTMLElement>('[data-bookmark-id]')
    const id = row?.dataset.bookmarkId
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      select({ type: 'select-all' })
      return
    }
    if (
      id &&
      (event.key === 'ContextMenu' ||
        (event.shiftKey && ['F10', 'Enter'].includes(event.key)))
    ) {
      event.preventDefault()
      event.stopPropagation()
      const bounds = target.getBoundingClientRect()
      menuPosition.current = { x: bounds.left, y: bounds.bottom }
      returnFocus.current = target
      const node = byId.get(id)
      if (node && !selectedIds.has(id)) select({ type: 'click', id })
      setMenu({
        ids: selectedIds.has(id) ? selected.map((node) => node.id) : [id],
      })
      setPanel(null)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setSelection(emptyListSelection())
      closeMenu()
      return
    }
    if (target.closest('[data-keyboard-section="tools"]')) {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        listRef.current
          ?.querySelectorAll<HTMLElement>('[data-tab-option]')
          .item(items.length - 1)
          ?.focus()
      }
      return
    }
    if (target.closest('[data-keyboard-section="header"]')) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        listRef.current
          ?.querySelector<HTMLElement>('[data-tab-option]')
          ?.focus()
      } else
        moveControlFocus(
          event,
          target.closest('[data-keyboard-section="header"]')!,
        )
      return
    }
    if (!target.closest('[data-keyboard-section="bookmarks"]')) return
    if (event.key === 'Tab') {
      event.preventDefault()
      rootRef.current
        ?.querySelector<HTMLElement>(
          event.shiftKey
            ? '[data-keyboard-section="header"] button:not(:disabled)'
            : '[data-keyboard-section="tools"] button',
        )
        ?.focus()
      return
    }
    if (id && event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      select({ type: 'space', id })
      return
    }
    if (id && ['Delete', 'Backspace'].includes(event.key)) {
      event.preventDefault()
      event.stopPropagation()
      const ids = selectedIds.has(id) ? selected.map((node) => node.id) : [id]
      if (ids.every((id) => byId.has(id) && canEditBookmark(byId.get(id)!)))
        begin('delete', ids)
      return
    }
    if (id && event.key === 'F2' && canEditBookmark(byId.get(id)!)) {
      event.preventDefault()
      begin('edit', [id])
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (folder?.parentId) void navigate(folder.parentId)
      return
    }
    if (id && event.key === 'ArrowRight' && byId.get(id)?.url === undefined) {
      event.preventDefault()
      void navigate(id)
      return
    }
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    const index = order.indexOf(id ?? focusedId ?? '')
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : index + (event.key === 'ArrowUp' ? -1 : 1)
    if (next < 0) {
      rootRef.current
        ?.querySelector<HTMLElement>(
          '[data-keyboard-section="header"] button:not(:disabled)',
        )
        ?.focus()
      return
    }
    if (next >= items.length) {
      rootRef.current
        ?.querySelector<HTMLElement>('[data-keyboard-section="tools"] button')
        ?.focus()
      return
    }
    const nextNode = items[next]!
    select({
      type: 'arrow',
      id: nextNode.id,
      shift: event.shiftKey,
      focusedBeforeMove: id,
    })
    if (canFocusInput()) {
      const option =
        listRef.current?.querySelectorAll<HTMLElement>('[data-tab-option]')[
          next
        ]
      option?.focus({ preventScroll: true })
      option?.scrollIntoView({ block: 'nearest' })
    }
  }
  return (
    <div
      ref={rootRef}
      data-tab-manager
      data-bookmark-manager
      className="relative h-full min-h-0"
      onKeyDownCapture={keyDown}
      onPointerDownCapture={(event) => {
        if (
          event.button === 0 &&
          menu &&
          !(event.target as Element).closest(
            '[data-manager-action-menu],[data-action-bar-menu-trigger],[data-folder-actions]',
          )
        )
          closeMenu()
      }}
    >
      <TabManagerShell
        mainLabel="Bookmarks"
        selectionMode={selection.mode}
        header={
          <header
            data-keyboard-section="header"
            className={`
              border-border shrink-0 space-y-2 border-b
              bg-[var(--manager-chrome)] p-2
            `}
          >
            <div className="flex min-w-0 items-center gap-1">
              <button
                aria-label="Parent folder"
                title="Parent folder"
                disabled={!folder?.parentId || busy}
                className={bookmarkControlClass}
                onClick={() =>
                  folder?.parentId && void navigate(folder.parentId)
                }
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <h2
                  className="truncate text-sm font-medium"
                  title={folder ? paths.get(folder.id) : 'Bookmarks'}
                >
                  {folder?.id === '0'
                    ? 'All bookmarks'
                    : folder
                      ? bookmarkLabel(folder) || 'Untitled folder'
                      : 'Bookmarks'}
                </h2>
                <p aria-live="polite" className="text-muted truncate text-xs">
                  {busy
                    ? 'Working…'
                    : selected.length
                      ? `${selected.length} selected`
                      : itemCount(folder?.children?.length ?? 0)}
                </p>
              </div>
              <button
                data-folder-actions
                aria-label="Folder actions"
                title="Folder actions"
                disabled={!folder || busy}
                aria-haspopup="menu"
                aria-expanded={
                  menu?.ids.length === 1 && menu.ids[0] === folder?.id
                }
                className={bookmarkControlClass}
                onClick={(event) => {
                  if (menu?.ids.length === 1 && menu.ids[0] === folder?.id) {
                    closeMenu()
                    return
                  }
                  const bounds = event.currentTarget.getBoundingClientRect()
                  returnFocus.current = event.currentTarget
                  menuPosition.current = { x: bounds.left, y: bounds.bottom }
                  setMenu({ ids: [folder!.id] })
                  setPanel(null)
                }}
              >
                <MoreHorizontal size={18} />
              </button>
              <button
                aria-label="New folder"
                title="New folder"
                disabled={busy}
                className={bookmarkControlClass}
                onClick={(event) => {
                  returnFocus.current = event.currentTarget
                  begin('folder')
                }}
              >
                <Plus size={18} />
              </button>
            </div>
            <label
              className={`
                border-border bg-input flex items-center gap-2 rounded-md border
                px-2
              `}
            >
              <Search
                size={16}
                className="text-muted shrink-0"
                aria-hidden="true"
              />
              <input
                aria-label="Filter bookmarks"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelection(emptyListSelection())
                  setFocusedId(null)
                  closeMenu()
                }}
                placeholder="Filter all bookmarks"
                className={`
                  focus-visible:ring-focus focus-visible:ring-2
                  min-h-10 min-w-0 flex-1 bg-transparent text-sm outline-none
                `}
              />
            </label>
          </header>
        }
        actionBar={
          <fieldset disabled={busy} className="min-w-0">
            <TabManagerActionBar
              model={menuModel}
              onIntent={menuIntent}
              menuRef={menuRef}
              menuPosition={menuPosition}
              returnFocus={returnFocus}
              navigation={navigation}
              selectionCount={targets.length}
              showUnselectedActions
            />
          </fieldset>
        }
      >
        <div className="space-y-2 p-2">
          {snapshot.status === 'loading' && (
            <p role="status" className="p-3 text-sm">
              Loading bookmarks…
            </p>
          )}
          {snapshot.error && (
            <p role="alert" className="p-3 text-sm">
              {snapshot.error}
            </p>
          )}
          {editor && (
            <div data-bookmark-editor>
              <BookmarkEditor
                key={`${editor.kind}:${editor.ids.join(',')}`}
                request={editor}
                nodes={nodes}
                folderId={folder?.id ?? '0'}
                folderLabels={folderLabels}
                windows={windows}
                windowId={windowId}
                busy={busy}
                onSubmit={(command) => void submit(command)}
                onCancel={() => setEditor(null)}
              />
            </div>
          )}
          <div
            ref={listRef}
            tabIndex={-1}
            data-keyboard-section="bookmarks"
            className="outline-none"
          >
            <TabList
              ariaLabel="Bookmark entries"
              deferOffscreen={items.length > 60}
            >
              {items.map((node) => (
                <li key={node.id}>
                  <BrowserTabItem
                    tabId={node.id}
                    data-bookmark-id={node.id}
                    title={
                      bookmarkLabel(node) ||
                      (node.url === undefined ? 'Untitled folder' : node.url)
                    }
                    url={node.url}
                    itemLabel={node.url === undefined ? 'Folder' : 'Bookmark'}
                    description={
                      query
                        ? paths.get(node.id)
                        : node.url === undefined
                          ? itemCount(node.children?.length ?? 0)
                          : !isNavigableUrl(node.url)
                            ? 'Address cannot be opened by Tabby'
                            : undefined
                    }
                    favicon={
                      node.url === undefined ? (
                        <Folder
                          size={20}
                          className={
                            getGroupColorClasses(
                              decodeBookmarkGroup(node.title)?.color ?? 'grey',
                            ).text
                          }
                          aria-hidden="true"
                        />
                      ) : (
                        <Bookmark
                          size={20}
                          className="text-muted"
                          aria-hidden="true"
                        />
                      )
                    }
                    selected={selectedIds.has(node.id)}
                    isMultiSelectMode={selection.mode === 'multi-select'}
                    onFocusCapture={(event) => {
                      physicalRowFocus.current = event.target as HTMLElement
                      setFocusedId(node.id)
                    }}
                    onClick={(event) => {
                      if (busy) return
                      select({
                        type: 'click',
                        id: node.id,
                        shift: event.shiftKey,
                        toggle: event.metaKey || event.ctrlKey,
                      })
                      if (!event.shiftKey && !event.metaKey && !event.ctrlKey)
                        activate(node)
                    }}
                    onActivate={() => {
                      select({ type: 'click', id: node.id })
                      activate(node)
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      showMenu(node, event)
                    }}
                    onAuxClick={(event) => {
                      if (
                        event.button !== 1 ||
                        node.url === undefined ||
                        targetWindowId === null ||
                        targetWindowId === undefined
                      )
                        return
                      event.preventDefault()
                      void run(() =>
                        actions.open(
                          node.id,
                          targetWindowId,
                          event.shiftKey ? 'new-window' : 'new-tab',
                        ),
                      )
                    }}
                    trailingAction={
                      node.url === undefined ? (
                        <button
                          aria-label={`Open folder: ${bookmarkLabel(node) || 'Untitled folder'}`}
                          className={cn(bookmarkControlClass, 'mr-1')}
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation()
                            void navigate(node.id)
                          }}
                        >
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                      ) : undefined
                    }
                  />
                </li>
              ))}
            </TabList>
            {snapshot.status === 'ready' && !items.length && (
              <p className="text-muted p-3 text-sm">
                {query
                  ? 'No matching bookmarks.'
                  : 'This folder is empty. Add a bookmark or folder to get started.'}
              </p>
            )}
            <button
              data-create-item="bookmark"
              className={cn(
                tabRowHeightClass,
                `
                  text-muted flex w-full items-center gap-3 rounded-md px-3 py-2
                  text-sm
                  hover:text-foreground hover:bg-accent-hover
                  focus-visible:ring-focus focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-inset
                `,
              )}
              disabled={busy}
              onClick={(event) => {
                returnFocus.current = event.currentTarget
                begin('bookmark')
              }}
            >
              <Plus size={20} aria-hidden="true" />
              New bookmark
            </button>
          </div>
        </div>
      </TabManagerShell>
    </div>
  )
}
