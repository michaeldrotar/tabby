import { WINDOW_ICONS } from '@extension/core/windowIdentity'
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  Code,
  Coffee,
  FlaskConical,
  Globe,
  Heart,
  Monitor,
  Music,
  Palette,
  Pencil,
  Plus,
} from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import { DragReveal } from '../../components/DragReveal'
import { RowCloseButton } from '../../components/RowCloseButton'
import { useSurfaceInputOwner } from '../../Surface'
import {
  getGroupColorClasses,
  TAB_GROUP_COLOR_IDS,
} from '../../tab-group/tabGroupColors'
import { cn } from '../../utils/cn'
import type { TabManagerIntent, TabManagerViewModel } from '../TabManager'
import type { BrowserTabGroupColor } from '@extension/core'

export const windowControlClass =
  'text-muted flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm hover:bg-highlighted/30 hover:text-foreground data-[hover=true]:bg-highlighted/30 data-[hover=true]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus'
const windowDropClass = 'bg-highlighted/30 text-foreground'
const windowChoiceClass = 'min-h-16 w-full justify-start gap-3 py-3 text-left'
const editorRowEntry = (row: Element) =>
  row.querySelector<HTMLElement>('[data-editor-done]') ??
  row.querySelector<HTMLElement>('[aria-pressed="true"]') ??
  row.querySelector<HTMLElement>('input,button')
const icons = {
  window: Monitor,
  briefcase: Briefcase,
  code: Code,
  book: BookOpen,
  flask: FlaskConical,
  palette: Palette,
  music: Music,
  coffee: Coffee,
  heart: Heart,
  globe: Globe,
}
export const WindowIcon = ({
  icon,
  iconUrl,
  size = 20,
  color = 'blue',
}: {
  icon?: string
  iconUrl?: string
  color?: BrowserTabGroupColor
  size?: number
}) => {
  const Icon = icons[icon as keyof typeof icons] ?? Monitor
  return !icon && iconUrl ? (
    <img src={iconUrl} width={size} height={size} alt="" className="shrink-0" />
  ) : (
    <Icon
      size={size}
      aria-hidden="true"
      className={cn('shrink-0', getGroupColorClasses(color).text)}
    />
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
  const window = model.windows.find(
    (window) => window.id === model.viewedWindowId,
  )
  return (
    <header
      className={`
        border-border flex shrink-0 items-center gap-1 border-b
        bg-[var(--manager-chrome)] p-2
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
            className="text-foreground block truncate font-medium"
            title={window?.title}
          >
            {window?.title ?? 'Windows'}
          </span>
          <span className="text-foreground mt-0.5 block truncate text-xs">
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
      <div role="list" aria-label="Windows" className="space-y-1">
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
                <span className="text-foreground block truncate font-medium">
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
  const input = useRef<HTMLInputElement>(null)
  const { canFocusInput } = useSurfaceInputOwner()
  useLayoutEffect(() => {
    if (canFocusInput()) {
      input.current?.focus()
      input.current?.select()
    }
  }, [canFocusInput])
  return (
    <form
      data-window-editor
      aria-label="Name and icon"
      className="space-y-5 p-4"
      onSubmit={(event) => {
        event.preventDefault()
        onIntent({ type: 'save-window' })
      }}
      onKeyDownCapture={(event) => {
        if (
          event.key === 'Enter' &&
          !event.nativeEvent.isComposing &&
          !(event.target as HTMLElement).closest('[data-editor-reset]') &&
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
                : [editorRowEntry(row)],
            )
            .filter((control): control is HTMLElement => !!control)
          const target = event.target as HTMLElement
          const index = stops.indexOf(target)
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
        if (target === input.current && horizontal) return
        const rows = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[data-editor-row]',
          ),
        )
        const row = target.closest<HTMLElement>('[data-editor-row]')
        if (!row) return
        const controls = Array.from(
          row.querySelectorAll<HTMLElement>('input,button'),
        )
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
          ['icons', 'colors'].includes(row.dataset.editorRow ?? '')
        )
          destination.click()
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
          className={`
            border-border bg-input mt-2 block min-h-10 w-full rounded-md border
            px-3 outline-none
            focus-visible:ring-focus focus-visible:ring-2
          `}
        />
      </label>
      <fieldset data-editor-row="icons">
        <legend className="mb-2 text-sm">Icon</legend>
        <div className="flex flex-wrap gap-2">
          {WINDOW_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              aria-label={`${icon[0]!.toUpperCase()}${icon.slice(1)} icon`}
              aria-pressed={draft.icon === icon}
              tabIndex={(draft.icon ?? WINDOW_ICONS[0]) === icon ? 0 : -1}
              className={cn(
                windowControlClass,
                'size-10 px-0',
                draft.icon === icon && 'ring-focus ring-2',
              )}
              onClick={() =>
                onIntent({ type: 'change-window-draft', value: { icon } })
              }
            >
              <WindowIcon icon={icon} color="grey" />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset data-editor-row="colors">
        <legend className="mb-2 text-sm">Color</legend>
        <div className="flex flex-wrap gap-2">
          {TAB_GROUP_COLOR_IDS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`${color[0]!.toUpperCase()}${color.slice(1)} icon color`}
              aria-pressed={draft.iconColor === color}
              tabIndex={
                (draft.iconColor ?? TAB_GROUP_COLOR_IDS[0]) === color ? 0 : -1
              }
              className={cn(
                windowControlClass,
                'size-10 px-0',
                draft.iconColor === color && 'ring-focus ring-2',
              )}
              onClick={() =>
                onIntent({
                  type: 'change-window-draft',
                  value: { iconColor: color },
                })
              }
            >
              <span
                className={cn(
                  'size-5 rounded-full',
                  getGroupColorClasses(color).dot,
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <div data-editor-row="actions" className="flex justify-between">
        <button
          data-editor-reset
          type="button"
          className={windowControlClass}
          onClick={() => onIntent({ type: 'reset-window' })}
        >
          Reset
        </button>
        <button
          data-editor-done
          type="submit"
          className={`
            bg-foreground text-background min-h-10 rounded-md px-3 text-sm
            hover:bg-foreground/90
            focus-visible:outline-focus focus-visible:outline
            focus-visible:outline-2 focus-visible:outline-offset-2
          `}
        >
          Done
        </button>
      </div>
    </form>
  )
}
