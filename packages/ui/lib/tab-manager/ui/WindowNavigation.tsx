import { useIsPresent } from 'framer-motion'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { DragReveal } from '../../components/DragReveal'
import { RowCloseButton } from '../../components/RowCloseButton'
import { useSurfaceInputOwner } from '../../Surface'
import { getGroupColorClasses } from '../../tab-group/tabGroupColors'
import { cn } from '../../utils/cn'
import { editorRowEntry, windowControlClass } from './windowControls'
import { WindowIcon } from './WindowIcon'
import { WindowIconPicker } from './WindowIconPicker'
import { WindowNameInput } from './WindowNameInput'
import type { TabManagerIntent, TabManagerViewModel } from '../TabManager'

const windowDropClass = 'bg-highlighted/30 text-foreground'
const windowChoiceClass = 'min-h-16 w-full justify-start gap-3 py-3 text-left'
export { windowControlClass } from './windowControls'
export { WindowIcon } from './WindowIcon'

export const WindowHeader = ({
  model,
  onIntent,
  revealing,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
  revealing?: boolean
}) => {
  const window = model.windows.find(
    (window) => window.id === model.viewedWindowId,
  )
  return (
    <header
      className={`
        flex shrink-0 items-center gap-1 border-b border-border
        bg-(--manager-chrome) p-2
      `}
      data-keyboard-section="header"
    >
      <button
        data-window-picker-trigger
        aria-label={`Switch window: ${window?.title ?? 'Windows'}`}
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
            {window
              ? `${window.tabs.length} ${window.tabs.length === 1 ? 'tab' : 'tabs'}${window.incognito ? ' · Private' : ''}`
              : 'Choose a window'}
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
      <button
        data-window-edit-trigger
        aria-label="Edit window"
        title="Edit window"
        aria-expanded={Boolean(model.editingWindow)}
        disabled={!window}
        className={cn(windowControlClass, 'size-10 shrink-0 px-0')}
        onClick={() => onIntent({ type: 'edit-window' })}
      >
        <Pencil size={18} />
      </button>
    </header>
  )
}

export const WindowPicker = ({
  model,
  onIntent,
  dragging = false,
  dropWindowId,
}: {
  model: TabManagerViewModel
  onIntent: (intent: TabManagerIntent) => void
  dragging?: boolean
  dropWindowId?: number | 'new' | null
}) => {
  const root = useRef<HTMLDivElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
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
            ? manager?.querySelector<HTMLButtonElement>(
                '[data-window-picker-trigger]',
              )
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
              onClick={() =>
                onIntent({ type: 'activate-window', windowId: window.id })
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
                  {window.tabs.length}{' '}
                  {window.tabs.length === 1 ? 'tab' : 'tabs'}
                  {window.incognito ? ' · Private' : ''}
                </span>
              </span>
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
          (event.target as HTMLElement).matches('[data-window-name-input]') &&
          (['ArrowUp', 'ArrowDown'].includes(event.key) ||
            (['Enter', 'Escape'].includes(event.key) &&
              event.currentTarget.querySelector('[role="listbox"]')))
        )
          return
        if (
          (event.target as HTMLElement).closest(
            '[data-editor-native],[data-icon-grid]',
          ) &&
          !['Tab', 'Escape'].includes(event.key)
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
          !(event.target as HTMLElement).closest(
            '[data-editor-reset],[role="tab"]',
          ) &&
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
                    ? '[data-window-edit-trigger]'
                    : '[data-keyboard-section="tools"] button',
                )
        }
        if (!destination) return
        event.preventDefault()
        event.stopPropagation()
        destination.focus()
        destination.scrollIntoView({ block: 'nearest' })
        if (
          horizontal &&
          ['icons', 'colors', 'types'].includes(row.dataset.editorRow ?? '')
        )
          destination.click()
      }}
    >
      <WindowNameInput
        input={input}
        value={draft.name}
        history={model.windowNameHistory ?? []}
        onChange={(name) =>
          onIntent({ type: 'change-window-draft', value: { name } })
        }
      />
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
