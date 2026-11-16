import { motion, useIsPresent } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  LocateFixed,
  Pencil,
  Plus,
} from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { DragReveal } from '../../components/DragReveal'
import { RowCloseButton } from '../../components/RowCloseButton'
import { useSurfaceInputOwner } from '../../Surface'
import { getGroupColorClasses } from '../../tab-group/tabGroupColors'
import { useShouldReduceMotion } from '../../useShouldReduceMotion'
import { cn } from '../../utils/cn'
import {
  editorRowEntry,
  windowControlClass,
  windowEditorInputClass,
} from './windowControls'
import {
  followsMoveWithShift,
  WindowFocusIndicator,
} from './WindowFocusIndicator'
import { WindowIcon } from './WindowIcon'
import { WindowIconPicker } from './WindowIconPicker'
import type {
  TabManagerIntent,
  TabManagerViewModel,
  TabManagerWindowView,
} from '../TabManager'
import type { ReactNode } from 'react'

const windowDropClass = 'bg-highlighted/30 text-foreground'
const windowChoiceClass = 'min-h-16 w-full justify-start gap-3 py-3 text-left'
export { windowControlClass } from './windowControls'
export { WindowIcon } from './WindowIcon'

const windowContents = (window: TabManagerWindowView) =>
  `${window.tabs.length} ${window.tabs.length === 1 ? 'tab' : 'tabs'}${window.groups.length ? ` · ${window.groups.length} ${window.groups.length === 1 ? 'group' : 'groups'}` : ''}${window.incognito ? ' · Private' : ''}`

const HeaderActionReveal = ({
  visible,
  width,
  children,
}: {
  visible: boolean
  width: number
  children: ReactNode
}) => {
  const reduced = useShouldReduceMotion()
  return (
    <motion.div
      initial={false}
      animate={{ width: visible ? width : 0, opacity: visible ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : 0.18, ease: 'easeOut' }}
      className="shrink-0 overflow-hidden"
    >
      {visible && (
        <div className="flex h-10 items-center gap-1">{children}</div>
      )}
    </motion.div>
  )
}

export const WindowHeader = ({
  model,
  onIntent,
  revealing,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
  revealing?: boolean
}) => {
  const returning = Boolean(model.editingWindow || model.windowPicker)
  const window = model.windows.find(
    (window) => window.id === model.viewedWindowId,
  )
  const viewingOtherWindow =
    window &&
    model.currentWindowId !== undefined &&
    window.id !== model.currentWindowId
  return (
    <header
      className={`
        flex shrink-0 flex-col border-b border-border bg-(--manager-chrome) p-2
      `}
      data-keyboard-section="header"
    >
      <div className="flex items-center">
        <HeaderActionReveal visible={returning} width={44}>
          <button
            data-back-to-tabs
            aria-label="Back to tabs"
            title="Back to tabs"
            className={cn(windowControlClass, 'size-10 px-0')}
            onClick={() =>
              onIntent({
                type: model.editingWindow
                  ? 'cancel-window-edit'
                  : 'dismiss-window-picker',
              })
            }
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </HeaderActionReveal>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button
            data-window-picker-trigger
            aria-label={`Choose window: ${window?.title ?? 'Windows'}`}
            aria-expanded={model.windowPicker}
            className={cn(
              windowControlClass,
              `min-w-0 flex-1 justify-start py-2 text-left`,
            )}
            onClick={() =>
              onIntent({
                type: model.windowPicker
                  ? 'dismiss-window-picker'
                  : 'open-window-picker',
              })
            }
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                getGroupColorClasses(window?.iconColor ?? 'blue').bg,
              )}
            >
              <WindowIcon
                icon={window?.icon}
                iconUrl={window?.iconUrl}
                color={window?.iconColor}
                size={24}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className="block truncate font-medium text-foreground"
                title={window?.title}
              >
                {window?.title ?? 'Windows'}
              </span>
              <span className="mt-0.5 block truncate text-xs text-foreground">
                {window ? windowContents(window) : 'Choose a window'}
              </span>
            </span>
            <DragReveal active={revealing}>
              <ChevronDown
                size={16}
                aria-hidden="true"
                className={cn(
                  'shrink-0 transition-transform',
                  model.windowPicker && 'rotate-180',
                )}
              />
            </DragReveal>
          </button>
          <HeaderActionReveal visible={Boolean(viewingOtherWindow)} width={68}>
            {viewingOtherWindow && (
              <>
                <button
                  aria-label="Show current window"
                  title="Show current window’s tabs"
                  className={cn(
                    windowControlClass,
                    'size-8 min-h-8 shrink-0 px-0',
                  )}
                  onClick={() =>
                    onIntent({
                      type: 'view-window',
                      windowId: model.currentWindowId!,
                    })
                  }
                >
                  <LocateFixed size={16} aria-hidden="true" />
                </button>
                <button
                  aria-label="Switch to this window"
                  title={`Switch to ${window.title}`}
                  className={cn(
                    windowControlClass,
                    'size-8 min-h-8 shrink-0 px-0',
                  )}
                  onClick={() =>
                    onIntent({ type: 'activate-window', windowId: window.id })
                  }
                >
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </HeaderActionReveal>
          <button
            data-window-edit-trigger
            aria-label={model.editingWindow ? 'Close editor' : 'Edit window'}
            title={model.editingWindow ? 'Close editor' : 'Edit window'}
            aria-expanded={Boolean(model.editingWindow)}
            disabled={!window}
            className={cn(windowControlClass, 'size-8 min-h-8 shrink-0 px-0')}
            onClick={() =>
              onIntent({
                type: 'edit-window',
              })
            }
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}

export const WindowPicker = ({
  shiftHeld,
  model,
  onIntent,
  dragging = false,
  dropWindowId,
  draggedTabIds,
}: {
  shiftHeld: boolean
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
  dragging?: boolean
  dropWindowId?: number | 'new' | null
  draggedTabIds?: readonly number[]
}) => {
  const switchByDefault = model.windowClickBehavior === 'switch'
  const root = useRef<HTMLDivElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
  const [hoveredWindowId, setHoveredWindowId] = useState<number | null>(null)
  const [focusedWindowId, setFocusedWindowId] = useState<number | null>(null)
  const actionWindowId = dragging
    ? dropWindowId
    : (hoveredWindowId ?? focusedWindowId)
  useLayoutEffect(() => {
    if (!dragging && canFocusInput())
      (
        root.current?.querySelector<HTMLButtonElement>(
          '[aria-current="true"]',
        ) ??
        root.current?.querySelector<HTMLButtonElement>('[data-window-choice]')
      )?.focus()
  }, [canFocusInput, dragging])
  return (
    <div
      ref={root}
      data-window-picker
      data-keyboard-section="windows"
      className="min-h-full p-2"
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onIntent({ type: 'dismiss-window-picker' })
          return
        }
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
        setHoveredWindowId(null)
        event.preventDefault()
        event.stopPropagation()
        const entries = Array.from(
          root.current?.querySelectorAll<HTMLButtonElement>(
            '[data-window-choice],[data-new-window]',
          ) ?? [],
        )
        const origin =
          (event.target as HTMLElement)
            .closest('[role="listitem"]')
            ?.querySelector<HTMLButtonElement>('[data-window-choice]') ??
          event.target
        const index = entries.indexOf(origin as HTMLButtonElement)
        const manager = root.current?.closest('[data-tab-manager]')
        const crossing =
          event.key === 'ArrowUp' && index === 0
            ? manager?.querySelector<HTMLButtonElement>('[data-back-to-tabs]')
            : event.key === 'ArrowDown' && index === entries.length - 1
              ? manager?.querySelector<HTMLButtonElement>(
                  '[data-keyboard-section="tools"] button',
                )
              : null
        if (crossing) {
          crossing.focus()
          return
        }
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? entries.length - 1
              : Math.max(
                  0,
                  Math.min(
                    entries.length - 1,
                    index + (event.key === 'ArrowUp' ? -1 : 1),
                  ),
                )
        entries[next]?.focus()
        entries[next]?.scrollIntoView?.({ block: 'nearest' })
      }}
    >
      <div role="list" aria-label="Windows" className="stack-y-1">
        {model.windows.map((window) => (
          <div
            key={window.id}
            role="listitem"
            className="group/closable-row relative flex items-center"
          >
            <button
              aria-current={
                window.id === model.viewedWindowId ? true : undefined
              }
              title={window.title}
              data-window-choice={window.id}
              data-viewing={window.id === model.viewedWindowId}
              className={cn(
                windowControlClass,
                windowChoiceClass,
                'group/window-choice pr-12',
                window.id === model.viewedWindowId &&
                  `
                    bg-accent-selected
                    hover:bg-accent-selected-hover
                  `,
                dropWindowId === window.id && windowDropClass,
              )}
              onPointerEnter={() => {
                setHoveredWindowId(window.id)
              }}
              onPointerLeave={() => setHoveredWindowId(null)}
              onFocus={() => setFocusedWindowId(window.id)}
              onBlur={() => setFocusedWindowId(null)}
              onClick={(event) =>
                onIntent({
                  type: 'choose-window',
                  windowId: window.id,
                  alternate: event.shiftKey,
                })
              }
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  getGroupColorClasses(window.iconColor ?? 'blue').bg,
                )}
              >
                <WindowIcon
                  icon={window.icon}
                  iconUrl={window.iconUrl}
                  color={window.iconColor}
                  size={22}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  {window.title}
                </span>
                <span
                  className={cn(
                    'block truncate text-xs',
                    window.id === model.viewedWindowId
                      ? 'text-foreground'
                      : `
                        text-muted
                        group-hover/window-choice:text-foreground
                      `,
                  )}
                >
                  {windowContents(window)}
                </span>
              </span>
              {shiftHeld && actionWindowId === window.id && (
                <WindowFocusIndicator
                  follow={
                    dragging
                      ? followsMoveWithShift(model, window.id, draggedTabIds)
                      : !switchByDefault
                  }
                />
              )}
            </button>
            {!dragging && (
              <RowCloseButton
                label={`Close window: ${window.title}`}
                title="Close window"
                active={window.id === model.viewedWindowId}
                className="absolute right-1"
                onClose={() =>
                  onIntent({ type: 'close-window', windowId: window.id })
                }
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="New window"
        data-new-window
        data-keyboard-section="new-window"
        data-create-item="window"
        className={cn(
          windowControlClass,
          windowChoiceClass,
          'mt-2',
          dropWindowId === 'new' && windowDropClass,
        )}
        onClick={() => onIntent({ type: 'create-window' })}
      >
        <span className="flex size-10 shrink-0 items-center justify-center">
          <Plus size={22} />
        </span>
        New window
        {dragging && shiftHeld && dropWindowId === 'new' && (
          <WindowFocusIndicator
            follow={followsMoveWithShift(model, undefined, draggedTabIds)}
          />
        )}
      </button>
    </div>
  )
}

export const WindowIdentityEditor = ({
  model,
  onIntent,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
}) => {
  const draft = model.editingWindow!
  const present = useIsPresent()
  const input = useRef<HTMLInputElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
  useLayoutEffect(() => {
    if (present && canFocusInput()) {
      input.current?.focus()
      input.current?.select()
    }
  }, [canFocusInput, present])
  return (
    <form
      data-window-editor
      aria-label="Name and icon"
      className="stack-y-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onIntent({ type: 'save-window' })
      }}
      onKeyDownCapture={(event) => {
        if (
          (event.target as HTMLElement).closest('[data-icon-grid]') &&
          !['Tab', 'Escape'].includes(event.key)
        )
          return
        if (
          (event.target as HTMLElement).matches('input[data-editor-native]') &&
          !['Tab', 'Escape', 'ArrowUp', 'ArrowDown'].includes(event.key)
        )
          return
        if (
          (event.target as HTMLElement).closest(
            '[data-icon-grid],input[data-editor-native]',
          ) &&
          event.key === 'Escape'
        )
          return
        if (
          event.key === 'Enter' &&
          !event.nativeEvent.isComposing &&
          !(event.target as HTMLElement).closest('button') &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey
        ) {
          event.preventDefault()
          event.stopPropagation()
          event.currentTarget.requestSubmit()
          return
        }
        if (
          event.key === 'Tab' &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          const form = event.currentTarget
          const manager = form.closest('[data-tab-manager]')
          const stops = Array.from(
            form.querySelectorAll<HTMLElement>('[data-editor-row]'),
          )
            .flatMap((row) =>
              row.dataset.editorRow === 'actions'
                ? [
                    row.querySelector<HTMLElement>('[data-editor-done]'),
                    row.querySelector<HTMLElement>('[data-editor-reset]'),
                  ]
                : row.dataset.editorRow === 'monogram'
                  ? [...row.querySelectorAll<HTMLInputElement>('input')]
                  : [editorRowEntry(row)],
            )
            .filter((control): control is HTMLElement => !!control)
          const target = event.target as HTMLElement
          const exactIndex = stops.indexOf(target)
          const index =
            exactIndex >= 0
              ? exactIndex
              : stops.findIndex(
                  (control) =>
                    control === target ||
                    (control
                      .closest('[data-editor-row]')
                      ?.getAttribute('data-editor-row') !== 'actions' &&
                      control.closest('[data-editor-row]') ===
                        target.closest('[data-editor-row]')),
                )
          const destination =
            stops[index + (event.shiftKey ? -1 : 1)] ??
            manager?.querySelector<HTMLElement>(
              event.shiftKey
                ? '[data-window-edit-trigger]'
                : '[data-keyboard-section="tools"] button',
            )
          if (destination) {
            event.preventDefault()
            event.stopPropagation()
            destination.focus()
            destination.scrollIntoView({ block: 'nearest' })
          }
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onIntent({ type: 'save-window' })
          return
        }
        if (
          !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
            event.key,
          ) ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return
        const target = event.target as HTMLElement
        const horizontal =
          event.key === 'ArrowLeft' || event.key === 'ArrowRight'
        if (target instanceof HTMLInputElement && horizontal) return
        const rows = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[data-editor-row]',
          ),
        )
        const row = target.closest<HTMLElement>('[data-editor-row]')
        if (!row) return
        const controls = Array.from(
          row.querySelectorAll<HTMLElement>('input,button'),
        ).filter((control) => control.closest('[data-editor-row]') === row)
        let destination: HTMLElement | null | undefined
        if (horizontal) {
          const index = controls.indexOf(target)
          destination =
            controls[
              (index + (event.key === 'ArrowLeft' ? -1 : 1) + controls.length) %
                controls.length
            ]
        } else {
          const index = rows.indexOf(row)
          const next = rows[index + (event.key === 'ArrowUp' ? -1 : 1)]
          destination = next
            ? editorRowEntry(next)
            : event.currentTarget
                .closest('[data-tab-manager]')
                ?.querySelector<HTMLElement>(
                  event.key === 'ArrowUp'
                    ? '[data-back-to-tabs]'
                    : '[data-keyboard-section="tools"] button',
                )
        }
        if (!destination) return
        event.preventDefault()
        event.stopPropagation()
        destination.focus()
        destination.scrollIntoView({ block: 'nearest' })
        if (horizontal && row.dataset.editorRow === 'types') destination.click()
      }}
    >
      <label data-editor-row="name" className="block text-sm">
        Name
        <input
          ref={input}
          maxLength={120}
          value={draft.name}
          onChange={(event) =>
            onIntent({
              type: 'change-window-draft',
              value: { name: event.target.value },
            })
          }
          className={windowEditorInputClass}
        />
      </label>
      <WindowIconPicker model={model} onIntent={onIntent} />
      <div data-editor-row="actions" className="flex justify-between">
        <button
          data-editor-reset
          type="button"
          className={windowControlClass}
          onClick={() => onIntent({ type: 'reset-window' })}
        >
          Reset
        </button>
        <button data-editor-done type="submit" className={windowControlClass}>
          Done
        </button>
      </div>
    </form>
  )
}
