import { Profiler } from '@extension/dev-utils/Profiler'
import { Favicon } from '@extension/ui/Favicon'
import { cn } from '@extension/ui/utils/cn'
import { Pin, Volume2, VolumeOff } from 'lucide-react'
import { forwardRef, memo } from 'react'
import type { HTMLAttributes } from 'react'

export type TabItemRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** Unique identifier for the tab (used for data attributes) */
  tabId?: number
  /** Display title for the tab */
  title?: string
  /** URL for favicon resolution */
  faviconUrl?: string
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
  /** Called when the tab row is clicked to activate the tab */
  onActivate: () => void
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
        faviconUrl,
        isActive = false,
        isHighlighted = false,
        isPinned = false,
        isMuted = false,
        isAudible = false,
        isDiscarded = false,
        onActivate,
        onClose,
        className,
        ...props
      },
      ref,
    ) => {
      const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && onClose) {
          e.preventDefault()
          onClose()
        }
      }

      return (
        <Profiler id="TabItemRow">
          <div
            ref={ref}
            data-tab-item={tabId}
            data-nav-type="tab"
            data-active={isActive}
            className={cn(
              `
                group relative overflow-hidden rounded-md
                has-[button:focus-visible]:ring-2
                has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                has-[button:focus-visible]:ring-offset-2
                has-[button:focus-visible]:ring-offset-background
              `,
              className,
            )}
            {...props}
          >
            <button
              type="button"
              className={cn(
                `
                  flex w-full items-center gap-3 rounded-md px-2 py-1.5
                  text-left text-sm transition-colors
                  focus:outline-none
                  focus-visible:outline-none
                `,
                isActive
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
              onClick={onActivate}
              onKeyDown={handleKeyDown}
            >
              {/* Favicon */}
              <div
                className={cn(
                  `
                    relative flex h-5 w-5 flex-shrink-0 items-center
                    justify-center
                  `,
                  isDiscarded && 'opacity-50',
                )}
              >
                <Favicon
                  pageUrl={faviconUrl}
                  size={20}
                  className={cn(
                    'transition-transform',
                    'group-hover:scale-110',
                  )}
                />
                {isDiscarded && (
                  <div
                    className={`
                      absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full
                      border border-background bg-muted
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
                    className="size-3 text-muted opacity-60"
                    aria-hidden="true"
                  />
                )}
                {isAudible && !isMuted && (
                  <Volume2
                    className="size-3 animate-pulse text-accent"
                    aria-hidden="true"
                  />
                )}
                {isMuted && (
                  <VolumeOff
                    className="size-3 text-muted opacity-60"
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          </div>
        </Profiler>
      )
    },
  ),
)
