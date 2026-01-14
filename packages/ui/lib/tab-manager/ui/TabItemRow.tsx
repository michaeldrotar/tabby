import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pin, Volume2, VolumeOff } from 'lucide-react'
import { forwardRef, memo } from 'react'
import { cn } from '../../utils/cn'
import type { HTMLAttributes, ReactNode } from 'react'

export type TabItemRowProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'title' | 'onSelect'
> & {
  /** Unique identifier for the tab (used for data attributes) */
  tabId?: number
  /** Display title for the tab */
  title?: string
  /** Icon/image to display (e.g., favicon component) */
  icon?: ReactNode
  /** Whether this tab is the active tab in its window */
  isActive?: boolean
  /** Whether this tab is highlighted (selected) */
  isHighlighted?: boolean
  /** Whether this tab is pinned */
  isPinned?: boolean
  /** Whether this tab is muted */
  isMuted?: boolean
  /** Whether this tab is playing audio */
  isAudible?: boolean
  /** Whether this tab has been discarded (unloaded from memory) */
  isDiscarded?: boolean
  /** Whether this tab is part of selection */
  selected?: boolean
  /** Whether in multi-select mode (affects visual treatment of focus vs selection) */
  isMultiSelectMode?: boolean
  /** Called when the tab row is clicked to activate the tab */
  onActivate: () => void
  /** Called when the tab is clicked for selection (with modifier keys) */
  onSelect?: (event: React.MouseEvent) => void
  /** Called when the tab should be closed (Delete/Backspace key) */
  onClose?: () => void
}

/**
 * A row component for displaying a single tab in the tab list.
 *
 * This is a presentational component that accepts primitive props.
 * It has no knowledge of Chrome APIs or domain-specific types.
 */
export const TabItemRow = memo(
  forwardRef<HTMLDivElement, TabItemRowProps>(
    (
      {
        tabId,
        title,
        icon,
        isActive = false,
        isHighlighted = false,
        isPinned = false,
        isMuted = false,
        isAudible = false,
        isDiscarded = false,
        selected = false,
        isMultiSelectMode = false,
        onActivate,
        onSelect,
        onClose,
        className,
        ...props
      },
      ref,
    ) => {
      const prefersReducedMotion = useReducedMotion()
      const handleClick = (e: React.MouseEvent) => {
        // If modifier keys are pressed, handle selection instead of activation
        if (e.metaKey || e.ctrlKey || e.shiftKey) {
          e.preventDefault()
          onSelect?.(e)
        } else {
          // Regular click: handle selection first, then activate
          onSelect?.(e)
          onActivate()
        }
      }

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && onClose) {
          e.preventDefault()
          onClose()
        }
      }

      return (
        <div
          ref={ref}
          data-tab-item={tabId}
          data-nav-type="tab"
          data-active={isActive}
          data-selected={selected}
          className={cn(
            `group relative overflow-hidden rounded-md`,
            // Transition for smooth mode changes
            'transition-shadow duration-150',
            // Focus ring styling via CSS based on mode
            isMultiSelectMode
              ? // Multi-select mode: prominent focus ring with offset
                `
                  has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                  has-[button:focus-visible]:ring-offset-background
                  has-[button:focus-visible]:ring-2
                  has-[button:focus-visible]:ring-offset-2
                `
              : // Default mode: subtle fused state ring when selected
                selected
                ? `
                  has-[button:focus-visible]:ring-foreground/20
                  has-[button:focus-visible]:ring-1
                  has-[button:focus-visible]:ring-inset
                `
                : // Not selected in default mode: show standard ring
                  `
                    has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                    has-[button:focus-visible]:ring-offset-background
                    has-[button:focus-visible]:ring-2
                    has-[button:focus-visible]:ring-offset-2
                  `,
            className,
          )}
          {...props}
        >
          <button
            type="button"
            className={cn(
              `
                flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left
                text-sm transition-colors
                focus:outline-none
                focus-visible:outline-none
              `,
              // Selection has highest priority for background
              selected
                ? `bg-accent/[calc(var(--accent-strength)*1%)] text-foreground`
                : isActive
                  ? `
                    bg-accent/[calc(var(--accent-strength)*1%)] text-foreground
                  `
                  : isHighlighted
                    ? `
                      bg-accent/[calc(var(--accent-strength)*1%)]
                      text-foreground
                    `
                    : `
                      text-foreground
                      group-hover:bg-highlighted/50
                    `,
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          >
            {/* Favicon with Active Tab Ring */}
            <div
              className={cn(
                `
                  relative flex h-5 w-5 flex-shrink-0 items-center
                  justify-center
                `,
                isDiscarded && 'opacity-50',
              )}
            >
              {/* Active Tab Ring - Subtle, elegant pulsing indicator */}
              <AnimatePresence>
                {isActive && !prefersReducedMotion && (
                  <motion.div
                    className={`
                      border-accent absolute inset-[-3px] rounded-full border-2
                    `}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.7, 0.4, 0.7],
                    }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{
                      scale: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                      opacity: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Static ring for reduced motion */}
              {isActive && prefersReducedMotion && (
                <div
                  className={`
                    border-accent absolute inset-[-3px] rounded-full border-2
                    opacity-70
                  `}
                />
              )}

              {icon || <div className="bg-muted/40 h-5 w-5 rounded-full" />}
              {isDiscarded && (
                <div
                  className={`
                    border-background bg-muted absolute -bottom-0.5 -right-0.5
                    h-2 w-2 rounded-full border
                  `}
                />
              )}
            </div>

            {/* Title */}
            <span
              className={cn(
                'flex-1 truncate',
                isActive && 'font-medium',
                isDiscarded && 'opacity-70',
              )}
            >
              {title || 'Untitled'}
            </span>

            {/* Status indicators */}
            <div className="flex items-center gap-1">
              {isPinned && (
                <Pin
                  className="text-muted size-3 opacity-60"
                  aria-hidden="true"
                />
              )}
              {isAudible && !isMuted && (
                <Volume2
                  className="text-accent size-3 animate-pulse"
                  aria-hidden="true"
                />
              )}
              {isMuted && (
                <VolumeOff
                  className="text-muted size-3 opacity-60"
                  aria-hidden="true"
                />
              )}
            </div>
          </button>
        </div>
      )
    },
  ),
)
