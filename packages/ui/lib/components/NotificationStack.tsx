import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef } from 'react'
import {
  useShouldReduceMotion,
  useShouldSettleMotion,
} from '../useShouldReduceMotion'
import { cn } from '../utils/cn'

export type NotificationStackProps = {
  items: { id: number; message: string; kind?: 'info' | 'error' }[]
  expanded: boolean
  onExpand: (expanded: boolean) => void
  onDismiss: (id: number) => void
  onEmptyFocus?: () => void
}

/** Controlled, instance-scoped confirmations; text remains selectable for copying. */
export const NotificationStack = ({
  items,
  expanded,
  onExpand,
  onDismiss,
  onEmptyFocus,
}: NotificationStackProps) => {
  const root = useRef<HTMLDivElement>(null)
  const focusedOwner = useRef<HTMLElement | null>(null)
  const shouldSettle = useShouldSettleMotion()
  const reduce = useShouldReduceMotion()
  const settle = shouldSettle || reduce === true
  const recoverFocus = useCallback(() => {
    const owner = focusedOwner.current
    if (
      owner &&
      !owner.isConnected &&
      document.activeElement === document.body
    ) {
      const next = root.current?.querySelector<HTMLButtonElement>(
        '[data-notification-card]:not([aria-hidden="true"]) [data-close-button]',
      )
      focusedOwner.current = null
      if (next) next.focus()
      else onEmptyFocus?.()
    }
  }, [onEmptyFocus])
  useLayoutEffect(recoverFocus, [items, recoverFocus])
  useLayoutEffect(() => {
    const observer = new MutationObserver(recoverFocus)
    if (root.current)
      observer.observe(root.current, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [recoverFocus])
  return (
    <div
      ref={root}
      data-notification-status={items.length ? '' : undefined}
      className="pointer-events-none absolute inset-0"
      style={{ clipPath: 'inset(-100vh 0 0 0)' }}
      onMouseEnter={() => onExpand(true)}
      onMouseLeave={() => onExpand(false)}
      onFocusCapture={(event) => {
        event.stopPropagation()
        focusedOwner.current = event.target as HTMLElement
      }}
      onBlurCapture={(event) => {
        event.stopPropagation()
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focusedOwner.current = null
      }}
    >
      <ol
        aria-label="Notifications"
        className={`
          absolute inset-x-0 bottom-0 m-0 flex list-none flex-col-reverse
          gap-1.5 p-0
        `}
        style={{
          height: expanded ? 'auto' : '100%',
          maxHeight: 'min(75vh,32rem)',
          overflowY: expanded ? 'auto' : 'visible',
          pointerEvents: items.length ? 'auto' : 'none',
        }}
      >
        <AnimatePresence initial={false} onExitComplete={recoverFocus}>
          {items.map((entry, index) => {
            const visible = expanded || index < 3
            const interactive = expanded || index === 0
            return (
              <motion.li
                key={entry.id}
                layout={!settle}
                data-notification-card
                data-notification-id={entry.id}
                data-front={index === 0}
                data-expanded={expanded}
                aria-hidden={!interactive}
                inert={!interactive}
                initial={settle ? false : { y: 53, opacity: 0 }}
                animate={{
                  y: expanded ? 0 : -index * 6,
                  scale: expanded ? 1 : 1 - Math.min(index, 3) * 0.05,
                  opacity: visible ? 1 : 0,
                }}
                exit={{ y: settle ? 0 : 53, opacity: 0 }}
                transition={{ duration: settle ? 0 : 0.4, ease: 'easeOut' }}
                className={`
                  text-muted flex min-h-[53px] items-center border-t p-2 text-xs
                `}
                style={{
                  position: expanded ? 'relative' : 'absolute',
                  bottom: expanded ? undefined : 0,
                  width: '100%',
                  height: expanded ? undefined : '100%',
                  zIndex: items.length - index,
                  paddingRight: 52,
                  background:
                    'color-mix(in srgb, var(--accent) calc(var(--accent-strength) * 0.5%), var(--background))',
                  borderColor:
                    'color-mix(in srgb, var(--accent) calc(var(--accent-strength) * 1%), var(--border))',
                  userSelect: 'text',
                  transformOrigin: 'bottom center',
                  pointerEvents: interactive ? 'auto' : 'none',
                }}
              >
                <span
                  role={entry.kind === 'error' ? 'alert' : 'status'}
                  className={cn(
                    'min-w-0 flex-1 whitespace-pre-wrap break-words leading-4',
                    !expanded && 'line-clamp-2',
                  )}
                >
                  {entry.message}
                </span>
                <button
                  type="button"
                  data-close-button
                  aria-label="Dismiss notification"
                  className={`
                    hover:bg-highlighted/50 hover:text-foreground
                    focus-visible:outline-accent focus-visible:outline
                    focus-visible:outline-2 focus-visible:-outline-offset-2
                    absolute right-2 top-2 flex size-9 items-center
                    justify-center rounded-md
                  `}
                  onClick={(event) => {
                    focusedOwner.current = event.currentTarget
                    onDismiss(entry.id)
                  }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
    </div>
  )
}
