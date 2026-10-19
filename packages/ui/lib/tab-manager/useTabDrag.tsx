import { getMoveBlockReason, getTabMoveUnits } from '@extension/core'
import { getTabPlacementReason } from '@extension/core/tabPlacement'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { TabManagerIntent, TabManagerViewModel } from './TabManager'
import type { BrowserSnapshot, TabPlacement } from '@extension/core'
import type { PointerEvent, RefObject } from 'react'

const REVEAL_DELAY = 780
const toSnapshot = (
  windows: TabManagerViewModel['windows'],
): BrowserSnapshot => ({
  state: 'loaded',
  revision: 0,
  windows,
  tabs: windows.flatMap((window) =>
    window.tabs.map((tab, index) => ({ ...tab, windowId: window.id, index })),
  ),
  groups: windows.flatMap((window) =>
    window.groups.map((group) => ({
      ...group,
      windowId: window.id,
      color: group.color ?? 'grey',
    })),
  ),
})
type DragView = {
  tabIds: number[]
  title: string
  description?: string
  pinned?: boolean
  mode: 'tabs' | 'windows'
  expanded: number[]
}
type Drop = {
  destination?: TabPlacement
  windowId?: number
  reason?: string
}
type Session = {
  native?: boolean
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  source: { type: 'tab' | 'group'; id: number }
  focus: HTMLElement | null
  scrollTop: number
  view: DragView | null
  hoverKey?: string
  hoverStarted: number
  drop?: Drop
  checkedSnapshot?: BrowserSnapshot
  hasWholeGroups?: boolean
  validation?: { snapshot: BrowserSnapshot; key: string; reason?: string }
}

/** A Surface owns its drag session, timers, hit testing and scrolling. */
export const useTabDrag = (
  root: RefObject<HTMLDivElement | null>,
  model: TabManagerViewModel,
  onIntent: (intent: TabManagerIntent) => void | Promise<void>,
  enabled: boolean,
) => {
  const snapshot = useMemo(() => toSnapshot(model.windows), [model.windows])
  const latest = useRef({ model, snapshot, onIntent, enabled, root })
  useLayoutEffect(() => {
    latest.current = { model, snapshot, onIntent, enabled, root }
  })
  const session = useRef<Session | null>(null)
  const suppressClick = useRef(false)
  const [view, setView] = useState<DragView | null>(null)
  const [feedback, setFeedback] = useState('')
  const [dropWindowId, setDropWindowId] = useState<number | 'new' | null>(null)
  const [revealing, setRevealing] = useState<string | null>(null)
  const [settlingExpanded, setSettlingExpanded] = useState<number[]>([])
  const ghost = useRef<HTMLDivElement>(null)
  const nativeImage = useRef<HTMLCanvasElement>(null)
  const marker = useRef<HTMLDivElement>(null)
  const restoration = useRef<{ selector: string; scrollTop?: number } | null>(
    null,
  )
  const restore = useCallback(() => {
    const pending = restoration.current
    if (!pending || session.current?.view) return
    const element = latest.current.root.current
    const target = element?.querySelector<HTMLElement>(pending.selector)
    if (!target) return
    if (pending.scrollTop !== undefined) {
      const scroll = element?.querySelector<HTMLElement>(
        '[data-manager-scroll] [data-radix-scroll-area-viewport]',
      )
      if (scroll) scroll.scrollTop = pending.scrollTop
    }
    target.focus({ preventScroll: true })
    restoration.current = null
  }, [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    const doc = element.ownerDocument
    let frame = 0
    let lastFrame = 0
    let clickTimer: ReturnType<typeof setTimeout> | undefined
    let nativeSource: EventTarget | null = null
    const viewport = () =>
      element.querySelector<HTMLElement>(
        '[data-manager-scroll] [data-radix-scroll-area-viewport]',
      )
    const finish = (commit: boolean) => {
      const current = session.current
      if (!current) return
      session.current = null
      nativeSource?.removeEventListener('dragend', nativeEnd)
      nativeSource = null
      current.focus?.removeAttribute('draggable')
      cancelAnimationFrame(frame)
      if (element.hasPointerCapture(current.pointerId))
        element.releasePointerCapture(current.pointerId)
      if (current.view) {
        suppressClick.current = true
        clickTimer = setTimeout(() => {
          suppressClick.current = false
        }, 0)
        setView(null)
        setRevealing(null)
        setDropWindowId(null)
        setFeedback('')
        element.style.removeProperty('user-select')
        element.style.removeProperty('cursor')
        if (marker.current) marker.current.style.display = 'none'
        const applied = commit && current.drop && !current.drop.reason
        const local =
          applied &&
          current.drop?.destination?.windowId ===
            latest.current.model.viewedWindowId
        if (!applied || local) {
          restoration.current = {
            selector:
              current.source.type === 'tab'
                ? `[data-tab-id="${current.source.id}"] [data-tab-option]`
                : `[data-group-id="${current.source.id}"] [data-group-option]`,
            ...(!applied ? { scrollTop: current.scrollTop } : {}),
          }
          requestAnimationFrame(restore)
        }
        if (applied && current.drop) {
          const destination = current.drop.destination
          const retained = current.view.expanded.filter(
            (id) => id === destination?.groupId,
          )
          setSettlingExpanded(retained)
          void (async () => {
            try {
              await latest.current.onIntent({
                type: 'place-tabs',
                tabIds: current.view!.tabIds,
                destination,
                windowId: current.drop!.windowId,
                ...(local ? { scrollTop: viewport()?.scrollTop ?? 0 } : {}),
              })
            } finally {
              setSettlingExpanded([])
            }
          })()
        }
      }
    }
    const updateView = (current: Session, next: DragView) => {
      const changesPane = current.view?.mode !== next.mode
      current.view = next
      current.drop = undefined
      setView(next)
      const scroll = viewport()
      if (scroll && changesPane) scroll.scrollTop = 0
    }
    const tick = (now: number) => {
      const current = session.current
      if (!current?.view) return
      const { model, enabled, snapshot } = latest.current
      if (!enabled) {
        finish(false)
        return
      }
      if (current.checkedSnapshot !== snapshot) {
        const ids = new Set(snapshot.tabs.map((tab) => tab.id))
        if (current.view.tabIds.some((id) => !ids.has(id))) {
          finish(false)
          return
        }
        current.checkedSnapshot = snapshot
        current.hasWholeGroups = getTabMoveUnits(
          current.view.tabIds,
          snapshot,
        ).some((unit) => unit.groupId !== undefined)
      }
      const reasonFor = (key: string, compute: () => string | undefined) => {
        if (
          current.validation?.snapshot !== snapshot ||
          current.validation.key !== key
        )
          current.validation = { snapshot, key, reason: compute() }
        return current.validation.reason
      }
      const target = doc.elementFromPoint(current.x, current.y)
      const scroll = target?.closest<HTMLElement>(
        '[data-radix-scroll-area-viewport]',
      )
      const scrollBounds =
        scroll && element.contains(scroll)
          ? scroll.getBoundingClientRect()
          : undefined
      const edge = scrollBounds ? Math.min(48, scrollBounds.height / 4) : 0
      const strength = !scrollBounds
        ? 0
        : current.y < scrollBounds.top + edge
          ? -Math.max(0, (scrollBounds.top + edge - current.y) / edge)
          : current.y > scrollBounds.bottom - edge
            ? Math.max(0, (current.y - scrollBounds.bottom + edge) / edge)
            : 0
      const bounds = element.getBoundingClientRect()
      if (ghost.current) {
        ghost.current.style.transform = `translate(${Math.max(8, Math.min(current.x - bounds.left + 12, bounds.width - ghost.current.offsetWidth - 8))}px, ${Math.max(0, Math.min(current.y - bounds.top + 16, bounds.height - ghost.current.offsetHeight - 8))}px)`
        ghost.current.style.visibility = 'visible'
      }
      if (marker.current) marker.current.style.display = 'none'
      current.drop = undefined
      let hoverKey: string | undefined
      let reveal: (() => void) | undefined
      let hoveredWindowId: number | 'new' | undefined
      const showLine = (row: Element, after: boolean, inset = false) => {
        if (!marker.current) return
        const rect = row.getBoundingClientRect()
        Object.assign(marker.current.style, {
          display: 'block',
          left: `${rect.left - bounds.left + (inset ? 16 : 0)}px`,
          top: `${(after ? rect.bottom : rect.top) - bounds.top}px`,
          width: `${rect.width - (inset ? 16 : 0)}px`,
        })
      }
      const changeHover = (key: string, callback: () => void) => {
        hoverKey = key
        reveal = callback
      }
      if (target && element.contains(target)) {
        const header = target.closest('[data-window-picker-trigger]')
        const choice = target.closest<HTMLElement>('[data-window-choice]')
        const newWindow = target.closest('[data-new-window]')
        if (header) {
          if (current.view.mode !== 'windows')
            changeHover('windows', () =>
              updateView(current, { ...current.view!, mode: 'windows' }),
            )
        } else if (current.view.mode === 'windows' && choice) {
          const windowId = Number(choice.dataset.windowChoice)
          const reason = reasonFor(`window-${windowId}`, () =>
            getMoveBlockReason(current.view!.tabIds, snapshot, windowId),
          )
          current.drop = { windowId, reason }
          if (!reason) hoveredWindowId = windowId
        } else if (current.view.mode === 'windows' && newWindow) {
          current.drop = {}
          hoveredWindowId = 'new'
        } else if (current.view.mode !== 'windows') {
          const window = model.windows.find(
            (window) => window.id === model.viewedWindowId,
          )
          if (!window) {
            finish(false)
            return
          }
          const windowId = window.id
          const selected = new Set(current.view.tabIds)
          const remaining = window.tabs.filter((tab) => !selected.has(tab.id))
          const pane = target.closest('[data-tab-pane]')
          const list = pane?.querySelector(':scope > [role="listbox"]')
          const item = Array.from(list?.children ?? []).find(
            (row) => row.getBoundingClientRect().bottom >= current.y,
          )
          const groupElement =
            item?.querySelector<HTMLElement>('[data-group-id]')
          const tabRow = item?.querySelector<HTMLElement>('[data-tab-id]')
          let destination: TabPlacement | undefined
          let visualBefore: (typeof window.tabs)[number] | undefined
          const placementAtRow = (row: HTMLElement, groupId?: number) => {
            const index = window.tabs.findIndex(
              (tab) => tab.id === Number(row.dataset.tabId),
            )
            if (index < 0) return undefined
            const rect = row.getBoundingClientRect()
            const following = window.tabs.slice(
              index + (current.y > (rect.top + rect.bottom) / 2 ? 1 : 0),
            )
            visualBefore = following[0]
            return {
              windowId,
              groupId,
              beforeTabId: following.find((tab) => !selected.has(tab.id))?.id,
            }
          }
          if (groupElement) {
            const groupId = Number(groupElement.dataset.groupId)
            const group = window.groups.find((group) => group.id === groupId)
            const members = remaining.filter((tab) => tab.groupId === groupId)
            const header = groupElement.querySelector('[data-group-header]')!
            const headerBounds = header.getBoundingClientRect()
            const expanded = !groupElement.dataset.collapsed
            const firstRow = groupElement.querySelector('[data-tab-id]')
            const firstTop =
              firstRow?.getBoundingClientRect().top ?? headerBounds.bottom
            const afterGroup =
              remaining[
                remaining.findLastIndex((tab) => tab.groupId === groupId) + 1
              ]?.id
            if (group && members.length) {
              if (!expanded || current.y < firstTop) {
                const lower =
                  current.y >= (headerBounds.top + headerBounds.bottom) / 2
                const intoGroup = expanded && lower && !current.hasWholeGroups
                if (intoGroup)
                  visualBefore = window.tabs.find(
                    (tab) => tab.groupId === groupId,
                  )
                destination = intoGroup
                  ? { windowId, groupId, beforeTabId: members[0]!.id }
                  : {
                      windowId,
                      beforeTabId: lower ? afterGroup : members[0]!.id,
                    }
                if (
                  !expanded &&
                  current.y >= headerBounds.top &&
                  !current.hasWholeGroups &&
                  !window.tabs.some((tab) => selected.has(tab.id) && tab.pinned)
                )
                  changeHover(`group-${groupId}`, () =>
                    updateView(current, {
                      ...current.view!,
                      expanded: [...current.view!.expanded, groupId],
                    }),
                  )
              } else {
                const row = Array.from(
                  groupElement.querySelectorAll<HTMLElement>('[data-tab-id]'),
                ).find((row) => row.getBoundingClientRect().bottom >= current.y)
                const creation = groupElement.querySelector(
                  '[data-create-item="tab"]',
                )
                if (row) {
                  destination = placementAtRow(row, groupId)
                } else if (
                  creation &&
                  current.y <= creation.getBoundingClientRect().bottom
                )
                  destination = { windowId, groupId }
                else destination = { windowId, beforeTabId: afterGroup }
              }
            }
          } else if (tabRow) {
            destination = placementAtRow(tabRow)
          } else if (pane) destination = { windowId }
          if (destination) {
            const pinnedCount = remaining.filter((tab) => tab.pinned).length
            const insertion =
              destination.beforeTabId !== undefined
                ? remaining.findIndex(
                    (tab) => tab.id === destination!.beforeTabId,
                  )
                : destination.groupId !== undefined
                  ? remaining.findLastIndex(
                      (tab) => tab.groupId === destination!.groupId,
                    ) + 1
                  : current.view.pinned === true
                    ? pinnedCount
                    : remaining.length
            const atPinnedBoundary =
              (current.view.pinned === true &&
                (insertion > pinnedCount ||
                  destination.groupId !== undefined ||
                  tabRow?.hasAttribute('data-pinned') !== true)) ||
              (current.view.pinned === false &&
                (insertion < pinnedCount ||
                  tabRow?.hasAttribute('data-pinned')))
            if (atPinnedBoundary)
              destination = {
                windowId,
                beforeTabId: remaining[pinnedCount]?.id,
              }
            const position = destination
            const reason = reasonFor(
              `position-${position.windowId}-${position.beforeTabId}-${position.groupId}`,
              () =>
                getTabPlacementReason(snapshot, current.view!.tabIds, position),
            )
            current.drop = { destination, reason }
            if (!reason) {
              const before = atPinnedBoundary
                ? window.tabs.find((tab) => !tab.pinned)
                : (visualBefore ??
                  remaining.find((tab) => tab.id === position.beforeTabId))
              const group =
                position.groupId === undefined
                  ? null
                  : element.querySelector(
                      `[data-group-id="${position.groupId}"]`,
                    )
              const anchor =
                group && before?.groupId !== position.groupId
                  ? group.querySelector('[data-create-item="tab"]')
                  : before
                    ? element.querySelector(
                        position.groupId === undefined &&
                          before.groupId !== undefined
                          ? `[data-group-id="${before.groupId}"]`
                          : `[data-tab-id="${before.id}"]`,
                      )
                    : element.querySelector(
                        '[data-tab-pane] > [data-create-item="tab"]',
                      )
              if (anchor) showLine(anchor, false)
              else if (group) {
                const header = group.querySelector('[data-group-header]')
                if (header) showLine(header, true, true)
              }
            }
          }
        }
      }
      setFeedback(current.drop?.reason ?? '')
      setDropWindowId(hoveredWindowId ?? null)
      if (current.hoverKey !== hoverKey) {
        current.hoverKey = hoverKey
        current.hoverStarted = now
        setRevealing(hoverKey ?? null)
      } else if (
        hoverKey &&
        now - current.hoverStarted >= REVEAL_DELAY &&
        reveal
      ) {
        current.hoverKey = undefined
        setRevealing(null)
        reveal()
      }
      if (scroll && scrollBounds && strength)
        scroll.scrollTop +=
          (Math.sign(strength) *
            strength ** 2 *
            650 *
            Math.min(32, now - lastFrame)) /
          1000
      lastFrame = now
      frame = requestAnimationFrame(tick)
    }
    const startDrag = (current: Session) => {
      const { model } = latest.current
      const window = model.windows.find(
        (window) => window.id === model.viewedWindowId,
      )
      if (!window) return
      const selected =
        (model.selectedTabIds.includes(current.source.id) &&
          current.source.type === 'tab') ||
        (model.selectedGroupIds.includes(current.source.id) &&
          current.source.type === 'group')
      const ids = selected
        ? new Set(model.selectedTabIds)
        : new Set(
            window.tabs
              .filter((tab) =>
                current.source.type === 'tab'
                  ? tab.id === current.source.id
                  : tab.groupId === current.source.id,
              )
              .map((tab) => tab.id),
          )
      const tabs = window.tabs.filter((tab) => ids.has(tab.id))
      if (!tabs.length) return
      const units = getTabMoveUnits(
        tabs.map((tab) => tab.id),
        latest.current.snapshot,
      )
      const groups = units.filter((unit) => unit.groupId !== undefined)
      const individualTabs = units.length - groups.length
      const names = units.map((unit) =>
        unit.groupId !== undefined
          ? window.groups.find((group) => group.id === unit.groupId)?.title ||
            'Unnamed group'
          : tabs.find((tab) => tab.id === unit.tabIds[0])!.title,
      )
      current.view = {
        tabIds: tabs.map((tab) => tab.id),
        title:
          units.length === 1
            ? names[0]!
            : [
                individualTabs &&
                  `${individualTabs} ${individualTabs === 1 ? 'tab' : 'tabs'}`,
                groups.length &&
                  `${groups.length} ${groups.length === 1 ? 'tab group' : 'tab groups'}`,
              ]
                .filter(Boolean)
                .join(' and '),
        description: units.length > 1 ? names.join(', ') : undefined,
        pinned: tabs.every((tab) => tab.pinned)
          ? true
          : tabs.every((tab) => !tab.pinned)
            ? false
            : undefined,
        mode: 'tabs',
        expanded: [],
      }
      setView(current.view)
      if (!current.native) element.setPointerCapture(current.pointerId)
      element.style.userSelect = 'none'
      element.style.cursor = 'grabbing'
      lastFrame = performance.now()
      frame = requestAnimationFrame(tick)
    }
    const move = (event: globalThis.PointerEvent) => {
      const current = session.current
      if (!current || current.pointerId !== event.pointerId) return
      current.x = event.clientX
      current.y = event.clientY
      if (
        !current.view &&
        Math.hypot(current.x - current.startX, current.y - current.startY) >= 6
      ) {
        startDrag(current)
      }
      if (current.view) event.preventDefault()
    }
    const up = (event: globalThis.PointerEvent) => {
      if (session.current?.native) return
      if (session.current?.pointerId === event.pointerId) {
        session.current.x = event.clientX
        session.current.y = event.clientY
        cancelAnimationFrame(frame)
        tick(performance.now())
        finish(true)
      }
    }
    const cancel = () => {
      if (!session.current?.native) finish(false)
    }
    const nativeStart = (event: DragEvent) => {
      const current = session.current
      if (!current || !event.dataTransfer) {
        event.preventDefault()
        return
      }
      current.native = true
      nativeSource = event.target
      nativeSource?.addEventListener('dragend', nativeEnd)
      current.x = event.clientX
      current.y = event.clientY
      if (!current.view) startDrag(current)
      event.dataTransfer.setData(
        'application/x-tabby-tabs',
        current.view!.tabIds.join(','),
      )
      event.dataTransfer.effectAllowed = 'move'
      if (nativeImage.current)
        event.dataTransfer.setDragImage(nativeImage.current, 0, 0)
    }
    const nativeOver = (event: DragEvent) => {
      const current = session.current
      if (!current?.native || !element.contains(event.target as Node)) return
      event.preventDefault()
      current.x = event.clientX
      current.y = event.clientY
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    }
    const nativeDrop = (event: DragEvent) => {
      if (!session.current?.native || !element.contains(event.target as Node))
        return
      nativeOver(event)
      cancelAnimationFrame(frame)
      tick(performance.now())
      finish(true)
    }
    const nativeEnd = () => finish(false)
    const key = (event: globalThis.KeyboardEvent) => {
      if (!session.current?.view) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.key === 'Escape') finish(false)
    }
    const click = (event: globalThis.MouseEvent) => {
      if (suppressClick.current) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    doc.addEventListener('pointermove', move, { passive: false })
    element.addEventListener('dragstart', nativeStart)
    doc.addEventListener('dragover', nativeOver)
    doc.addEventListener('dragenter', nativeOver)
    doc.addEventListener('drop', nativeDrop)
    doc.addEventListener('dragend', nativeEnd)
    doc.addEventListener('pointerup', up)
    doc.addEventListener('pointercancel', cancel)
    doc.addEventListener('keydown', key, true)
    element.addEventListener('click', click, true)
    element.addEventListener('lostpointercapture', cancel)
    doc.defaultView?.addEventListener('blur', cancel)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(clickTimer)
      doc.removeEventListener('pointermove', move)
      element.removeEventListener('dragstart', nativeStart)
      doc.removeEventListener('dragover', nativeOver)
      doc.removeEventListener('dragenter', nativeOver)
      doc.removeEventListener('drop', nativeDrop)
      doc.removeEventListener('dragend', nativeEnd)
      nativeSource?.removeEventListener('dragend', nativeEnd)
      session.current?.focus?.removeAttribute('draggable')
      doc.removeEventListener('pointerup', up)
      doc.removeEventListener('pointercancel', cancel)
      doc.removeEventListener('keydown', key, true)
      element.removeEventListener('click', click, true)
      element.removeEventListener('lostpointercapture', cancel)
      doc.defaultView?.removeEventListener('blur', cancel)
      element.style.removeProperty('user-select')
      element.style.removeProperty('cursor')
      session.current = null
    }
  }, [root, restore, model.status])

  const pointerDown = (event: PointerEvent) => {
    if (
      !enabled ||
      session.current?.view ||
      event.button !== 0 ||
      model.windowPicker ||
      model.editingWindow ||
      model.actionMenu ||
      model.actionPanel ||
      (model.renamingGroupId !== null && model.renamingGroupId !== undefined)
    )
      return
    const target = event.target as Element
    const row = target.closest<HTMLElement>(
      '[data-tab-option],[data-group-option]',
    )
    if (!row || target.closest('button:not([data-group-option]),input,a'))
      return
    const tab = row.closest<HTMLElement>('[data-tab-id]')
    const group = row.closest<HTMLElement>('[data-group-id]')
    const source = tab
      ? { type: 'tab' as const, id: Number(tab.dataset.tabId) }
      : group
        ? { type: 'group' as const, id: Number(group.dataset.groupId) }
        : undefined
    if (!source) return
    row.draggable = true
    session.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      source,
      focus: row,
      scrollTop: model.scrollTop ?? 0,
      view: null,
      hoverStarted: 0,
    }
  }
  return {
    view,
    dropWindowId,
    revealing,
    expanded: [...(view?.expanded ?? []), ...settlingExpanded],
    pointerDown,
    restore,
    overlay: (
      <>
        <canvas
          ref={nativeImage}
          width={1}
          height={1}
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0"
        />
        {view ? (
          <div
            className={`
              pointer-events-none absolute inset-0 z-50 overflow-hidden
            `}
            aria-hidden="true"
          >
            <div
              ref={marker}
              data-drop-indicator
              className="bg-accent absolute h-0.5 rounded-full"
            />
            <div
              ref={ghost}
              data-drag-preview
              style={{ visibility: 'hidden' }}
              className={`
                border-accent/50 bg-background/95 text-foreground absolute
                left-0 top-0 max-w-72 rounded-lg border px-3 py-2 text-sm
                shadow-lg
              `}
            >
              <div className="truncate font-medium">{view.title}</div>
              {view.description ? (
                <div className="text-muted truncate text-xs">
                  {view.description}
                </div>
              ) : null}
              {feedback ? (
                <div className="text-muted max-w-64 text-xs">{feedback}</div>
              ) : null}
            </div>
          </div>
        ) : null}
      </>
    ),
  }
}
