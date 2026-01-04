import { tt } from '@extension/i18n/plurals'
import { forwardRef, memo } from 'react'
import { Favicon } from '../../Favicon'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'
import { cn } from '../../utils/cn'
import type { HTMLAttributes } from 'react'

export type WindowRailItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'id'> & {
  id: number
  title: string
  activeTabUrl?: string
  tabCount: number
  /** Whether this is the current browser window */
  isActive: boolean
  /** Whether this window's tabs are displayed in the tab pane */
  isViewing: boolean
  /** Whether the sidebar is expanded showing full window info */
  isExpanded: boolean
  /** Whether this window is part of selection */
  selected?: boolean
  /** Whether keyboard focus is on this item (for multi-select mode) */
  isFocused?: boolean
  onClick: (event: React.MouseEvent) => void
  onClose?: () => void
}

export const WindowRailItem = memo(
  forwardRef<HTMLDivElement, WindowRailItemProps>(
    (
      {
        id,
        title,
        activeTabUrl,
        tabCount,
        isActive,
        isViewing,
        isExpanded,
        selected = false,
        isFocused = false,
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
            className={cn(
              `
                relative flex w-full items-center gap-3 overflow-clip rounded-md
                p-2 outline-none
              `,
              // Focus ring styling - shown when keyboard focused in multi-select mode
              // or via default focus-visible
              isFocused
                ? `
                  ring-2 ring-accent/[calc(var(--accent-strength)*1%)]
                  ring-offset-2 ring-offset-background
                `
                : `
                  focus-visible:ring-2
                  focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-background
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
                  'h-6 w-1 rounded-r-full bg-foreground/60',
                  isViewing ? 'bg-foreground/50' : 'bg-muted/20',
                )}
              />
            )}

            <div
              className={`
                flex h-8 w-8 flex-shrink-0 items-center justify-center
              `}
            >
              {activeTabUrl ? (
                <Favicon pageUrl={activeTabUrl} size={24} />
              ) : (
                <div className="h-4 w-4 rounded-full bg-muted/40" />
              )}
            </div>

            {/* TODO: Fix this to toggle visible/invisible on the text, transition-[visibility] isn't working and hides the text too soon */}
            <div className={cn('w-full overflow-clip text-left')}>
              {/* Keep fixed width so the text doesn't move as the sidebar opens and closes to reveal the full content */}
              <div className={`flex w-44 flex-1 flex-col`}>
                <span className="truncate text-sm font-medium leading-tight">
                  {title}
                </span>
                <span
                  className={cn(
                    'text-xs',
                    isViewing ? 'text-foreground/70' : 'text-muted',
                  )}
                >
                  {tt('nTabs', tabCount)}
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
            <div className="text-xs text-tooltip-foreground/50">
              {tt('nTabs', tabCount)}
            </div>
          </TooltipContent>
        </Tooltip>
      )
    },
  ),
)
