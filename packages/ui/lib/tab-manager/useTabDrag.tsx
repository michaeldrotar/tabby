import { getMoveBlockReason, getTabMoveUnits } from '@extension/core'
import { getTabPlacementReason } from '@extension/core/tabPlacement'
import { motion } from 'framer-motion'
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

const REVEAL_DELAY = 650
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
  mode: 'tabs' | 'windows' | 'destination'
  windowId: number
  expanded: number[]
}
type Drop = {
  destination?: TabPlacement
  windowId?: number
  reason?: string
}
type Session = {
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  source: { type: 'tab' | 'group'; id: number }
  focus: HTMLElement | null
  scrollTop: number
  view: DragView | null
  hitX?: number
  hitY?: number
  hoverKey?: string
  hoverStarted: number
  readyWindow?: number
  navigationArmed?: boolean
  drop?: Drop
  checkedSnapshot?: BrowserSnapshot
  hasWholeGroups?: boolean
  validation?: { snapshot: BrowserSnapshot; key: string; reason?: string }
}

/** A Surface owns its drag session, timers, hit testing and scrolling. */
export const useTabDrag = (
  root: RefObject<HTMLDivElement | null>,
  model: TabManagerViewModel,
  onIntent: (intent: TabManagerIntent) => void,
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
  const [windowHover, setWindowHover] = useState<{
    id: number
    ready: boolean
    delay: number
  } | null>(null)
  const [hover, setHover] = useState<{
    key: string
    x: number
    y: number
    width: number
    windowId?: number
  } | null>(null)
  const ghost = useRef<HTMLDivElement>(null)
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
    const viewport = () =>
      element.querySelector<HTMLElement>(
        '[data-manager-scroll] [data-radix-scroll-area-viewport]',
      )
    const finish = (commit: boolean) => {
      const current = session.current
      if (!current) return
      session.current = null
      cancelAnimationFrame(frame)
      if (element.hasPointerCapture(current.pointerId))
        element.releasePointerCapture(current.pointerId)
      if (current.view) {
        suppressClick.current = true
        clickTimer = setTimeout(() => {
          suppressClick.current = false
        }, 0)
        setView(null)
        setHover(null)
        setWindowHover(null)
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
        if (commit && current.drop && !current.drop.reason) {
          latest.current.onIntent({
            type: 'place-tabs',
            tabIds: current.view.tabIds,
            destination: current.drop.destination,
            windowId: current.drop.windowId,
          })
        }
      }
    }
    const updateView = (current: Session, next: DragView) => {
      const changesPane =
        current.view?.mode !== next.mode ||
        current.view.windowId !== next.windowId
      current.view = next
      current.drop = undefined
      setView(next)
      const scroll = viewport()
      if (scroll && changesPane) scroll.scrollTop = 0
      if (changesPane) {
        current.readyWindow = undefined
        current.navigationArmed = false
        setWindowHover(null)
      }
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
      const scrolling =
        scroll &&
        (strength < 0
          ? scroll.scrollTop > 0
          : strength > 0 &&
            scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight)
      const bounds = element.getBoundingClientRect()
      if (ghost.current)
        ghost.current.style.transform = `translate(${Math.max(8, Math.min(current.x - bounds.left + 12, bounds.width - ghost.current.offsetWidth - 8))}px, ${Math.max(0, Math.min(current.y - bounds.top + 16, bounds.height - ghost.current.offsetHeight - 8))}px)`
      if (marker.current) marker.current.style.display = 'none'
      current.drop = undefined
      let hoverKey: string | undefined
      let reveal: (() => void) | undefined
      let hoverElement: Element | null = null
      let hoveredWindowId: number | undefined
      // Scrolling beneath a stationary pointer must not open a window.
      const pointerMoved =
        current.x !== current.hitX || current.y !== current.hitY
      current.hitX = current.x
      current.hitY = current.y
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
      const changeHover = (key: string, row: Element, callback: () => void) => {
        hoverKey = key
        hoverElement = row
        reveal = callback
      }
      if (target && element.contains(target)) {
        const header = target.closest('[data-window-picker-trigger]')
        const choice = target.closest<HTMLElement>('[data-window-choice]')
        const openWindow = target.closest<HTMLElement>(
          '[data-drag-open-window]',
        )
        const newWindow = target.closest('[data-new-window]')
        if (header) {
          if (current.view.mode !== 'windows')
            changeHover('windows', header, () =>
              updateView(current, { ...current.view!, mode: 'windows' }),
            )
        } else if (current.view.mode === 'windows' && (choice || openWindow)) {
          const windowId = Number(
            openWindow?.dataset.dragOpenWindow ?? choice?.dataset.windowChoice,
          )
          const reason = reasonFor(`window-${windowId}`, () =>
            getMoveBlockReason(current.view!.tabIds, snapshot, windowId),
          )
          current.drop = { windowId, reason }
          if (!reason) {
            const rowBounds = (choice ?? openWindow!).getBoundingClientRect()
            const canNavigate =
              !scrolling &&
              (!scrollBounds ||
                (rowBounds.top >= scrollBounds.top &&
                  rowBounds.bottom <= scrollBounds.bottom))
            if (canNavigate) {
              hoveredWindowId = windowId
              if (current.readyWindow === windowId) {
                if (!openWindow) current.navigationArmed = true
                else if (pointerMoved && current.navigationArmed)
                  updateView(current, {
                    ...current.view,
                    mode: 'destination',
                    windowId,
                  })
              } else
                changeHover(`window-${windowId}`, choice ?? openWindow!, () => {
                  current.readyWindow = windowId
                  current.navigationArmed = false
                })
            }
          }
        } else if (current.view.mode === 'windows' && newWindow) {
          current.drop = {}
        } else if (current.view.mode !== 'windows') {
          const windowId = current.view.windowId
          const window = model.windows.find((window) => window.id === windowId)
          if (!window) {
            finish(false)
            return
          }
          const selected = new Set(current.view.tabIds)
          const remaining = window.tabs.filter((tab) => !selected.has(tab.id))
          const groupHeader = target.closest<HTMLElement>('[data-group-header]')
          const creation = target.closest<HTMLElement>(
            '[data-create-item="tab"]',
          )
          const tabRow =
            target.closest<HTMLElement>('[data-tab-id]') ??
            (!groupHeader && !creation && target.closest('[data-tab-pane]')
              ? [3, -3]
                  .map((offset) =>
                    doc
                      .elementFromPoint(current.x, current.y + offset)
                      ?.closest<HTMLElement>('[data-tab-id]'),
                  )
                  .find((row) => row && element.contains(row))
              : undefined)
          let destination: TabPlacement | undefined
          if (tabRow) {
            const tab = window.tabs.find(
              (tab) => tab.id === Number(tabRow.dataset.tabId),
            )
            if (tab && !selected.has(tab.id)) {
              const rect = tabRow.getBoundingClientRect()
              const after = current.y > rect.top + rect.height / 2
              destination = {
                windowId,
                groupId: tab.groupId,
                beforeTabId: after
                  ? remaining[
                      remaining.findIndex((item) => item.id === tab.id) + 1
                    ]?.id
                  : tab.id,
              }
            }
          } else if (groupHeader) {
            const groupId = Number(
              groupHeader.closest<HTMLElement>('[data-group-id]')?.dataset
                .groupId,
            )
            const group = window.groups.find((group) => group.id === groupId)
            const members = window.tabs.filter((tab) => tab.groupId === groupId)
            const rect = groupHeader.getBoundingClientRect()
            const fraction = (current.y - rect.top) / rect.height
            const wholeGroups = current.hasWholeGroups
            if (group && !members.every((tab) => selected.has(tab.id))) {
              const inside = fraction > 0.25 && fraction < 0.75 && !wholeGroups
              const after = fraction >= (wholeGroups ? 0.5 : 0.75)
              const last = remaining.findLastIndex(
                (tab) => tab.groupId === groupId,
              )
              destination = inside
                ? { windowId, groupId }
                : {
                    windowId,
                    beforeTabId: after
                      ? remaining[last + 1]?.id
                      : members.find((tab) => !selected.has(tab.id))?.id,
                  }
              if (
                inside &&
                group.collapsed &&
                !current.view.expanded.includes(groupId)
              )
                changeHover(`group-${groupId}`, groupHeader, () =>
                  updateView(current, {
                    ...current.view!,
                    expanded: [...current.view!.expanded, groupId],
                  }),
                )
            }
          } else if (creation || target.closest('[data-tab-pane]')) {
            const groupId =
              creation?.closest<HTMLElement>('[data-group-id]')?.dataset.groupId
            destination = {
              windowId,
              ...(groupId ? { groupId: Number(groupId) } : {}),
            }
          }
          if (destination) {
            const position = destination
            const reason = reasonFor(
              `position-${position.windowId}-${position.beforeTabId}-${position.groupId}`,
              () =>
                getTabPlacementReason(snapshot, current.view!.tabIds, position),
            )
            current.drop = { destination, reason }
            if (!reason) {
              const before = remaining.find(
                (tab) => tab.id === position.beforeTabId,
              )
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
      if (current.readyWindow !== hoveredWindowId) {
        current.readyWindow = undefined
        current.navigationArmed = false
      }
      if (current.hoverKey !== hoverKey) {
        current.hoverKey = hoverKey
        current.hoverStarted = now
        const rect = (hoverElement as Element | null)?.getBoundingClientRect()
        setHover(
          rect && hoverKey
            ? {
                key: hoverKey,
                x: rect.left - bounds.left,
                y: rect.bottom - bounds.top - 3,
                width: rect.width,
                ...(hoveredWindowId !== undefined
                  ? { windowId: hoveredWindowId }
                  : {}),
              }
            : null,
        )
      } else if (
        hoverKey &&
        now - current.hoverStarted >= REVEAL_DELAY &&
        reveal
      ) {
        current.hoverKey = undefined
        setHover(null)
        reveal()
      }
      setWindowHover((previous) => {
        if (hoveredWindowId === undefined) return previous ? null : previous
        const ready = current.readyWindow === hoveredWindowId
        return previous?.id === hoveredWindowId && previous.ready === ready
          ? previous
          : { id: hoveredWindowId, ready, delay: REVEAL_DELAY }
      })
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
    const move = (event: globalThis.PointerEvent) => {
      const current = session.current
      if (!current || current.pointerId !== event.pointerId) return
      current.x = event.clientX
      current.y = event.clientY
      if (
        !current.view &&
        Math.hypot(current.x - current.startX, current.y - current.startY) >= 6
      ) {
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
        current.view = {
          tabIds: tabs.map((tab) => tab.id),
          title: tabs.length === 1 ? tabs[0]!.title : `${tabs.length} tabs`,
          mode: 'tabs',
          windowId: window.id,
          expanded: [],
        }
        setView(current.view)
        element.setPointerCapture(event.pointerId)
        element.style.userSelect = 'none'
        element.style.cursor = 'grabbing'
        lastFrame = performance.now()
        frame = requestAnimationFrame(tick)
      }
      if (current.view) event.preventDefault()
    }
    const up = (event: globalThis.PointerEvent) => {
      if (session.current?.pointerId === event.pointerId) {
        session.current.x = event.clientX
        session.current.y = event.clientY
        cancelAnimationFrame(frame)
        tick(performance.now())
        finish(true)
      }
    }
    const cancel = () => finish(false)
    const key = (event: globalThis.KeyboardEvent) => {
      if (!session.current?.view) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (event.key === 'Escape') cancel()
    }
    const click = (event: globalThis.MouseEvent) => {
      if (suppressClick.current) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    doc.addEventListener('pointermove', move, { passive: false })
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
    windowHover,
    pointerDown,
    restore,
    overlay: view ? (
      <div
        className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
        aria-hidden="true"
      >
        <div
          ref={marker}
          data-drop-indicator
          className="bg-accent absolute h-0.5 rounded-full"
        />
        {hover && hover.windowId === undefined ? (
          <div
            key={hover.key}
            data-drag-timer
            className="bg-accent/20 absolute h-1 overflow-hidden rounded-full"
            style={{ left: hover.x, top: hover.y, width: hover.width }}
          >
            <motion.div
              className="bg-accent h-full origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: REVEAL_DELAY / 1000, ease: 'linear' }}
            />
          </div>
        ) : null}
        <div
          ref={ghost}
          data-drag-preview
          className={`
            border-accent/50 bg-background/95 text-foreground absolute left-0
            top-0 max-w-72 rounded-lg border px-3 py-2 text-sm shadow-lg
          `}
        >
          <div className="truncate font-medium">{view.title}</div>
          {feedback ? (
            <div className="text-muted max-w-64 text-xs">{feedback}</div>
          ) : null}
        </div>
      </div>
    ) : null,
  }
}
