import { useLayoutEffect, useRef, useState } from 'react'
import { useSurface, useSurfaceId } from './Surface'

export type WalkthroughStep = {
  title: string
  description: string
  target: string
}

export const discoveryButtonClass =
  'rounded-sm border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50'

export const Walkthrough = ({
  name,
  steps,
  onComplete,
  busy,
  error,
}: {
  name: string
  steps: readonly WalkthroughStep[]
  onComplete: () => void
  busy: boolean
  error?: string | null
}) => {
  const surface = useSurface()
  const titleId = useSurfaceId('walkthrough-title')
  const descriptionId = useSurfaceId('walkthrough-description')
  const dialog = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const [index, setIndex] = useState(0)
  const [position, setPosition] = useState<{
    left: number
    top: number
    arrow: number | null
    below: boolean
    target: { left: number; top: number; width: number; height: number } | null
  } | null>(null)
  const step = steps[index]!
  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    const handleKey = (event: KeyboardEvent) => {
      event.stopPropagation()
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!busy) onComplete()
      }
      if (event.key !== 'Tab') return
      const buttons = [
        ...element.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
      ]
      const active = element.ownerDocument.activeElement
      const current = buttons.findIndex((button) => button === active)
      event.preventDefault()
      buttons[
        (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length
      ]?.focus()
    }
    element.addEventListener('keydown', handleKey)
    return () => element.removeEventListener('keydown', handleKey)
  }, [busy, onComplete])
  useLayoutEffect(() => {
    const root = surface?.root
    if (!root) return
    const update = () => {
      const bounds = root.getBoundingClientRect()
      const anchor = root.querySelector<HTMLElement>(step.target)
      const rect = anchor?.getBoundingClientRect()
      const width = Math.min(320, Math.max(0, bounds.width - 24))
      const height = card.current?.offsetHeight ?? 210
      const target =
        rect && rect.width && rect.height
          ? {
              left: Math.max(4, rect.left - bounds.left),
              top: Math.max(4, rect.top - bounds.top),
              width: Math.min(rect.width, bounds.width - 8),
              height: Math.min(rect.height, bounds.height - 8),
            }
          : null
      const below =
        !!target && target.top + target.height + height + 24 < bounds.height
      const left = Math.max(
        12,
        Math.min(
          target
            ? target.left + target.width / 2 - width / 2
            : (bounds.width - width) / 2,
          bounds.width - width - 12,
        ),
      )
      const top = Math.max(
        12,
        Math.min(
          target
            ? below
              ? target.top + target.height + 12
              : target.top - height - 12
            : (bounds.height - height) / 2,
          bounds.height - height - 12,
        ),
      )
      const separated =
        target &&
        (below ? top >= target.top + target.height : top + height <= target.top)
      setPosition({
        left,
        top,
        below,
        target,
        arrow: separated
          ? Math.max(
              20,
              Math.min(width - 20, target.left + target.width / 2 - left),
            )
          : null,
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    if (card.current) observer.observe(card.current)
    root.addEventListener('scroll', update, true)
    root.ownerDocument.defaultView?.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      root.removeEventListener('scroll', update, true)
      root.ownerDocument.defaultView?.removeEventListener('resize', update)
    }
  }, [surface?.root, step])
  useLayoutEffect(() => {
    const root = surface?.root
    if (!root) return
    const previous = root?.ownerDocument.activeElement
    const background = [...(dialog.current?.parentElement?.children ?? [])]
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== dialog.current,
      )
      .map((element) => ({ element, inert: element.inert }))
    background.forEach(({ element }) => {
      element.inert = true
    })
    next.current?.focus({ preventScroll: true })
    return () => {
      background.forEach(({ element, inert }) => {
        element.inert = inert
      })
      if (
        previous instanceof HTMLElement &&
        previous.isConnected &&
        root?.contains(previous)
      )
        previous.focus({ preventScroll: true })
      else
        root
          ?.querySelector<HTMLElement>(
            '[data-omnibar-query], [data-window-picker-trigger]',
          )
          ?.focus({ preventScroll: true })
    }
  }, [surface?.root])
  useLayoutEffect(() => {
    const element = dialog.current
    if (!surface?.root || !element) return
    if (busy) element.focus({ preventScroll: true })
    else if (!element.contains(element.ownerDocument.activeElement))
      next.current?.focus({ preventScroll: true })
  }, [busy, surface?.root])
  return (
    <div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-label={name}
      data-walkthrough
      className="absolute inset-0 z-100 overflow-auto bg-foreground/10"
    >
      {position?.target && (
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute rounded-md border-2 border-accent
          "
          style={position.target}
        />
      )}
      <div
        ref={card}
        data-walkthrough-card
        className="
          absolute w-[calc(100%-24px)] max-w-80 rounded-lg border
          border-accent-border bg-card p-4 text-card-foreground shadow-lg
        "
        style={{ left: position?.left ?? 12, top: position?.top ?? 12 }}
      >
        {position?.arrow !== null && position?.arrow !== undefined && (
          <span
            aria-hidden="true"
            className="absolute size-3 rotate-45 border-accent-border bg-card"
            style={{
              left: position.arrow - 6,
              ...(position.below
                ? { top: -7, borderLeftWidth: 1, borderTopWidth: 1 }
                : { bottom: -7, borderRightWidth: 1, borderBottomWidth: 1 }),
            }}
          />
        )}
        <p className="mb-2 text-xs text-muted">
          {name} · {index + 1} of {steps.length}
        </p>
        <h2 id={titleId} className="text-base font-semibold">
          {step.title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm/relaxed">
          {step.description}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm">
            {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={discoveryButtonClass}
            disabled={busy}
            onClick={onComplete}
          >
            Skip tour
          </button>
          <div className="ml-auto flex gap-2">
            {index > 0 && (
              <button
                type="button"
                className={discoveryButtonClass}
                disabled={busy}
                onClick={() => setIndex(index - 1)}
              >
                Back
              </button>
            )}
            <button
              ref={next}
              type="button"
              className={discoveryButtonClass}
              disabled={busy}
              onClick={() =>
                index === steps.length - 1 ? onComplete() : setIndex(index + 1)
              }
            >
              {index === steps.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
