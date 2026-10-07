import { forwardRef, memo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'
import { cn } from '../../utils/cn'
import type { HTMLAttributes, ReactNode } from 'react'

export type WindowRailItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
  id: number
  title: string
  /** Icon/image to display (e.g., favicon component) */
  icon?: ReactNode
  /** Subtitle text (e.g., "8 tabs") */
  subtitle: string
  /** Whether this is the current browser window */
  isActive: boolean
  /** Whether this window's tabs are displayed in the tab pane */
  isViewing: boolean
  /** Whether the sidebar is expanded showing full window info */
  isExpanded: boolean
  /** Whether this window is part of selection */
  selected?: boolean
  /** Whether in multi-select mode (affects visual treatment of focus vs selection) */
  isMultiSelectMode?: boolean
  onClick: (event: React.MouseEvent) => void
  onClose?: () => void
}

export const WindowRailItem = memo(
  forwardRef<HTMLDivElement, WindowRailItemProps>(
    (
      {
        id,
        title,
        icon,
        subtitle,
        isActive,
        isViewing,
        isExpanded,
        selected = false,
        isMultiSelectMode = false,
        onClick,
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

      const button = (
        <div
          ref={ref}
          className={cn('group relative w-full', className)}
          {...props}
        >
          <button
            onClick={onClick}
            onKeyDown={handleKeyDown}
            data-nav-type="window"
            data-nav-id={id}
            data-active={isActive}
            data-selected={selected}
            data-viewing={isViewing}
            className={cn(
              `
                relative flex w-full items-center gap-3 overflow-clip p-2
                outline-none
              `,
              // Viewing Window Connection: asymmetric border-radius
              // When viewing, the right edge is flush (rounded-r-none) to visually
              // "connect" with the tab pane, creating a sense of context and flow
              isViewing
                ? 'rounded-l-lg rounded-r-none' // Left side rounded, right edge flush
                : 'rounded-md', // Standard rounded when not viewing
              // Transition for smooth mode changes
              'transition-all duration-200',
              // Focus ring styling via CSS based on mode
              isMultiSelectMode
                ? // Multi-select mode: prominent focus ring with offset
                  `
                    focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                    focus-visible:ring-offset-background focus-visible:ring-2
                    focus-visible:ring-offset-2
                  `
                : // Default mode: subtle fused state when selected/viewing
                  selected || isViewing
                  ? `
                    focus-visible:ring-foreground/20 focus-visible:ring-1
                    focus-visible:ring-inset
                  `
                  : // Not selected/viewing: show standard focus ring
                    `
                      focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                      focus-visible:ring-offset-background focus-visible:ring-2
                      focus-visible:ring-offset-2
                    `,
              // Selection has highest priority for background
              selected
                ? 'bg-accent/[calc(var(--accent-strength)*1%)] text-foreground'
                : isViewing
                  ? `
                    bg-accent/[calc(var(--accent-strength)*1%)] text-foreground
                  `
                  : isActive
                    ? 'bg-input/50'
                    : `
                      text-foreground
                      group-hover:bg-highlighted/50
                    `,
            )}
          >
            {isActive && (
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute left-0 top-1/2 -translate-y-1/2',
                  'bg-foreground/60 h-6 w-1 rounded-r-full',
                  isViewing ? 'bg-foreground/50' : 'bg-muted/20',
                )}
              />
            )}

            <div
              className={`
                flex h-8 w-8 flex-shrink-0 items-center justify-center
              `}
            >
              {icon || <div className="bg-muted/40 h-4 w-4 rounded-full" />}
            </div>

            {/* TODO: Fix this to toggle visible/invisible on the text, transition-[visibility] isn't working and hides the text too soon */}
            <div className={cn('w-full overflow-clip text-left')}>
              {/* Keep fixed width so the text doesn't move as the sidebar opens and closes to reveal the full content */}
              <div className="flex w-44 flex-1 flex-col">
                <span className="truncate text-sm font-medium leading-tight">
                  {title}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isViewing ? 'text-foreground/70' : 'text-muted',
                  )}
                >
                  {subtitle}
                </span>
              </div>
            </div>
          </button>
        </div>
      )

      if (isExpanded) return button

      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">
            <div>{title}</div>
            <div className="text-tooltip-foreground/50 text-xs">{subtitle}</div>
          </TooltipContent>
        </Tooltip>
      )
    },
  ),
)
