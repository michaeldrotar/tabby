import {
  createEmptySelectionSnapshot,
  createSelectionInteractionState,
  reduceSelectionIntent,
} from '@extension/core/selection/SelectionModel'
import { useSurface, useSurfaceInputOwner } from '@extension/ui/Surface'
import {
  DownloadsHeader,
  RecentDownloads,
} from '@extension/ui/tab-manager/RecentDownloads'
import { TabManagerActionBar } from '@extension/ui/tab-manager/ui/TabManagerActionBar'
import { TabManagerShell } from '@extension/ui/tab-manager/ui/TabManagerShell'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'
import { projectDownloadActions } from './downloadsModel'
import type { TabManagerView } from './view'
import type {
  DownloadAction,
  DownloadsResource,
} from '@extension/core/downloads'
import type {
  SelectionIntent,
  SelectionModelContext,
} from '@extension/core/selection/SelectionModel'
import type { SelectionActionIntent } from '@extension/ui/tab-manager/ui/TabManagerActionBar'
import type { KeyboardEvent, MouseEvent } from 'react'

const emptySelection = (): SelectionModelContext => ({
  selection: { ...createEmptySelectionSnapshot(), mode: 'default' },
  interaction: createSelectionInteractionState(),
})
const itemRef = (id: number) => ({ type: 'tab' as const, id })

export const RecentDownloadsExperience = ({
  resource,
  view,
  active,
  onOpenSearch,
  onOpenOptions,
}: {
  resource: DownloadsResource
  view: TabManagerView
  active: boolean
  onOpenSearch: () => void
  onOpenOptions: () => void
}) => {
  const surface = useSurface()
  const { canFocusInput } = useSurfaceInputOwner()
  const live = active && (!surface || surface.inputMode === 'live')
  const [selection, setSelection] = useState(emptySelection)
  const [focusedId, setFocusedId] = useState<number>()
  const menuOpen = useStore(view, (state) => state.downloadsMenu)
  const setMenuOpen = (menu: NonNullable<typeof menuOpen> | null) =>
    view.setState({ downloadsMenu: menu })
  const [error, setError] = useState<string>()
  const listRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuPosition = useRef<{ x: number; y: number } | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  useEffect(() => {
    if (!live) return
    void resource.start()
    return () => resource.dispose()
  }, [live, resource])
  const orderedItems = snapshot.items.map((item) => itemRef(item.id))
  const selectedIds = new Set(
    snapshot.items
      .filter((item) => selection.selection.tabIds.has(item.id))
      .map((item) => item.id),
  )
  const select = (intent: SelectionIntent) =>
    setSelection((previous) => reduceSelectionIntent(previous, intent))
  const focus = (id: number) => {
    const option = listRef.current?.querySelector<HTMLElement>(
      `[data-download-id="${id}"] [role="option"]`,
    )
    if (canFocusInput()) {
      option?.focus({ preventScroll: true })
      option?.scrollIntoView({ block: 'nearest' })
    }
    setFocusedId(id)
  }
  const openMenu = (id?: number, position?: { x: number; y: number }) => {
    if (!live || !canFocusInput()) return
    if (id !== undefined) {
      if (!selectedIds.has(id))
        select({
          type: 'click',
          item: itemRef(id),
          pane: 'tab',
          shift: false,
          toggle: false,
          orderedItems,
        })
      focus(id)
    }
    returnFocus.current = listRef.current?.ownerDocument
      .activeElement as HTMLElement | null
    menuPosition.current = position ?? null
    setMenuOpen({ position })
  }
  const activate = (id: number) => {
    if (!live || !canFocusInput()) return
    const item = snapshot.items.find((item) => item.id === id)
    if (item?.warning) {
      void openAll()
      return
    }
    if (item?.actions.includes('open') && snapshot.canOpen)
      void resource.execute(id, 'open')
    else openMenu(id)
  }
  const openAll = async () => {
    try {
      await resource.openAll()
      setError(undefined)
    } catch {
      setError('Could not open Chrome downloads. Try again.')
    }
  }
  const onSelect = (id: number, event: MouseEvent) => {
    if (!live || !canFocusInput()) return
    select({
      type: 'click',
      item: itemRef(id),
      pane: 'tab',
      shift: event.shiftKey,
      toggle: event.metaKey || event.ctrlKey,
      orderedItems,
    })
    focus(id)
    setMenuOpen(null)
  }
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!live || !canFocusInput()) return
    const row = (event.target as Element).closest<HTMLElement>(
      '[data-download-id]',
    )
    const id = row ? Number(row.dataset.downloadId) : undefined
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      select({ type: 'select-all', pane: 'tab', orderedItems })
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      select({ type: 'escape' })
      setMenuOpen(null)
      return
    }
    if (id === undefined) return
    if (
      event.key === 'ContextMenu' ||
      (event.key === 'F10' && event.shiftKey)
    ) {
      event.preventDefault()
      const bounds = row!.getBoundingClientRect()
      openMenu(id, { x: bounds.x + 20, y: bounds.bottom })
      return
    }
    if (event.key === ' ') {
      event.preventDefault()
      select({ type: 'space', item: itemRef(id), pane: 'tab' })
      return
    }
    const index = orderedItems.findIndex((item) => item.id === id)
    const next =
      event.key === 'ArrowDown'
        ? Math.min(index + 1, orderedItems.length - 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? orderedItems.length - 1
              : undefined
    if (next === undefined || !orderedItems[next]) return
    event.preventDefault()
    select(
      event.shiftKey
        ? {
            type: 'shift-arrow',
            item: orderedItems[next],
            focusedBeforeMove: itemRef(id),
            pane: 'tab',
            orderedItems,
          }
        : { type: 'arrow', item: orderedItems[next], pane: 'tab' },
    )
    focus(orderedItems[next].id)
  }
  const onIntent = (intent: SelectionActionIntent) => {
    if (!live) return
    if (intent.type === 'open-search') onOpenSearch()
    else if (intent.type === 'open-settings') onOpenOptions()
    else if (intent.type === 'open-action-menu') openMenu()
    else if (intent.type === 'dismiss-action-menu') setMenuOpen(null)
    else if (intent.type === 'run-action') {
      setMenuOpen(null)
      if (intent.actionId === 'review') {
        void openAll()
        return
      }
      const action = intent.actionId as DownloadAction
      void resource.execute([...selectedIds], action)
    }
  }
  if (!active) return null
  return (
    <div data-tab-manager data-downloads-manager className="h-full min-h-0">
      <TabManagerShell
        mainLabel="Downloads"
        selectionMode={selection.selection.mode}
        header={<DownloadsHeader snapshot={snapshot} />}
        actionBar={
          <TabManagerActionBar
            model={{
              selectionCount: selectedIds.size,
              selectionLabel: `${selectedIds.size} selected`,
              emptySelectionMessage: 'Select downloads to see actions.',
              actions: projectDownloadActions(snapshot, selectedIds),
              actionMenu: active && menuOpen ? {} : null,
            }}
            onIntent={onIntent}
            menuRef={menuRef}
            menuPosition={menuPosition}
            returnFocus={returnFocus}
          />
        }
      >
        <RecentDownloads
          snapshot={error ? { ...snapshot, error } : snapshot}
          selectedIds={selectedIds}
          focusedId={focusedId}
          listRef={listRef}
          onSelect={onSelect}
          onFocus={setFocusedId}
          onActivate={activate}
          onKeyDown={keyDown}
          onContextMenu={(id, event) => {
            event.preventDefault()
            openMenu(id, { x: event.clientX + 20, y: event.clientY })
          }}
          onRequestAccess={() => {
            void resource.requestAccess()
          }}
          onOpenAll={() => {
            void openAll()
          }}
        />
      </TabManagerShell>
    </div>
  )
}
