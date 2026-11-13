import { formatShortcut } from '@extension/shared/utils/platform'
import { History, Trash2 } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Kbd, KbdGroup } from '../../Kbd'
import { useSurfaceInputOwner } from '../../Surface'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'
import { cn } from '../../utils/cn'
import { windowControlClass, windowEditorInputClass } from './windowControls'
import type { RefObject } from 'react'

export const WindowNameInput = ({
  input,
  value,
  history,
  isMac = false,
  onChange,
  onForget,
}: {
  input: RefObject<HTMLInputElement | null>
  value: string
  history: readonly string[]
  isMac?: boolean
  onChange: (name: string) => void
  onForget: (name: string) => void
}) => {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const { canFocusInput } = useSurfaceInputOwner()
  const close = (target: HTMLElement | null = trigger.current) => {
    setOpen(false)
    target?.focus()
  }
  useLayoutEffect(() => {
    if (open && canFocusInput())
      (
        popup.current?.querySelector<HTMLButtonElement>(
          '[data-history-choice]',
        ) ?? popup.current
      )?.focus()
  }, [open, canFocusInput])
  useEffect(() => {
    if (!open) return
    const document = root.current!.ownerDocument
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside, true)
    return () => document.removeEventListener('pointerdown', outside, true)
  }, [open])
  return (
    <div
      ref={root}
      data-editor-row="name"
      className="relative text-sm"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={id}>Name</label>
      <div className="relative mt-2">
        <input
          id={id}
          ref={input}
          data-window-name-input
          aria-keyshortcuts="Alt+ArrowDown"
          autoComplete="off"
          maxLength={120}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'ArrowDown' &&
              event.altKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              event.stopPropagation()
              setOpen(true)
            }
          }}
          className={cn(windowEditorInputClass, 'mt-0 pr-10')}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={trigger}
              type="button"
              data-window-name-history-trigger
              aria-label="Previous names"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? `${id}-history` : undefined}
              className={cn(
                windowControlClass,
                'absolute inset-y-0 right-0.5 my-auto size-8 min-h-8 px-0',
              )}
              onClick={() => {
                setOpen(!open)
              }}
            >
              <History size={16} aria-hidden="true" />
            </button>
          </TooltipTrigger>
          {!open && (
            <TooltipContent
              side="top"
              sideOffset={6}
              className="flex items-center gap-2"
            >
              Previous names
              <KbdGroup>
                <Kbd>{formatShortcut('Alt', isMac)}</Kbd>
                <Kbd>↓</Kbd>
              </KbdGroup>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
      {open && (
        <div
          ref={popup}
          id={`${id}-history`}
          data-name-history-popup
          role="dialog"
          tabIndex={-1}
          aria-label="Previous names"
          className="
            absolute top-full left-0 z-20 mt-1 w-48 max-w-full rounded-md border
            border-border bg-popover p-1 text-popover-foreground shadow-lg
          "
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget) &&
              event.relatedTarget !== trigger.current
            )
              setOpen(false)
          }}
          onKeyDownCapture={(event) => {
            event.stopPropagation()
            if (event.nativeEvent.isComposing) return
            if (event.key === 'Escape') {
              event.preventDefault()
              close()
            } else if (
              ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(
                event.key,
              ) &&
              !event.altKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey
            ) {
              const horizontal =
                event.key === 'ArrowLeft' || event.key === 'ArrowRight'
              const rows = [
                ...event.currentTarget.querySelectorAll<HTMLElement>(
                  '[data-history-row]',
                ),
              ]
              const row = (event.target as HTMLElement).closest<HTMLElement>(
                '[data-history-row]',
              )
              if (event.key === 'ArrowUp' && (!row || row === rows[0])) {
                event.preventDefault()
                close(input.current)
                return
              }
              if (!row) return
              const controls = (element: HTMLElement) => [
                ...element.querySelectorAll<HTMLElement>('button'),
              ]
              const current = controls(row).indexOf(event.target as HTMLElement)
              const direction =
                event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1
              const nextRow = horizontal
                ? row
                : rows[rows.indexOf(row) + direction]
              const destinations = nextRow ? controls(nextRow) : []
              const destination =
                destinations[
                  horizontal
                    ? current + direction
                    : Math.min(current, destinations.length - 1)
                ]
              event.preventDefault()
              if (!destination) return
              destination.focus()
              destination.scrollIntoView({ block: 'nearest' })
            }
          }}
        >
          <ul
            aria-label="Previous window names"
            className="max-h-48 overflow-y-auto"
          >
            {history.map((name, index) => (
              <li
                key={name}
                data-history-row
                className="flex items-center gap-1"
              >
                <button
                  type="button"
                  data-history-choice
                  className={cn(
                    windowControlClass,
                    'min-h-8 min-w-0 flex-1 justify-start px-2 text-left',
                  )}
                  onClick={() => {
                    onChange(name)
                    setOpen(false)
                    input.current?.focus()
                  }}
                >
                  <span className="truncate" title={name}>
                    {name}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Forget name: ${name}`}
                  title="Forget name"
                  className={cn(
                    windowControlClass,
                    'size-7 min-h-7 shrink-0 px-0',
                  )}
                  onClick={() => {
                    const choices =
                      popup.current?.querySelectorAll<HTMLButtonElement>(
                        '[data-history-choice]',
                      )
                    const next =
                      choices?.[index + 1] ??
                      choices?.[index - 1] ??
                      popup.current
                    next?.focus()
                    onForget(name)
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!history.length && (
            <p role="status" className="px-1 py-3 text-muted">
              No previous names yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
