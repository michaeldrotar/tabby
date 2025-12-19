import { Favicon } from '../../Favicon'
import { CloseIcon } from '../../icons'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'
import { cn } from '../../utils/cn'
import { tt } from '@extension/i18n'

export type WindowRailItemProps = {
  id: number
  title: string
  activeTabUrl?: string
  tabCount: number
  isActive: boolean
  isSelected: boolean
  isExpanded: boolean
  onClick: () => void
  onClose?: () => void
}

export const WindowRailItem = ({
  id,
  title,
  activeTabUrl,
  tabCount,
  isActive,
  isSelected,
  isExpanded,
  onClick,
  onClose,
}: WindowRailItemProps) => {
  const button = (
    <div className="group relative w-full">
      <button
        onClick={onClick}
        onKeyDown={(e) => {
          if ((e.key === 'Delete' || e.key === 'Backspace') && onClose) {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }
        }}
        data-nav-type="window"
        data-nav-id={id}
        data-selected={isSelected}
        data-active={isActive}
        className={cn(
          `
            relative flex w-full items-center gap-3 overflow-clip rounded-md p-2
            outline-none
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
            focus-visible:ring-offset-2 focus-visible:ring-offset-background
          `,
          isSelected
            ? 'bg-accent/[calc(var(--accent-strength)*1%)] text-foreground'
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
              isSelected ? 'bg-foreground/50' : 'bg-muted/20',
            )}
          />
        )}

        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
          {activeTabUrl ? (
            <Favicon pageUrl={activeTabUrl} size={24} />
          ) : (
            <div className="h-4 w-4 rounded-full bg-muted/40" />
          )}
        </div>

        {/* TODO: Fix this to toggle visible/invisible on the text, transition-[visibility] isn't working and hides the text too soon */}
        <div className={cn('w-full overflow-clip text-left')}>
          {/* Keep fixed width so the text doesn't move as the sidebar opens and closes to reveal the full content */}
          <div
            className={`
              flex w-44 flex-1 flex-col
              group-hover:w-36
            `}
          >
            <span className="truncate text-sm font-medium leading-tight">
              {title}
            </span>
            <span
              className={cn(
                'text-xs',
                isSelected ? 'text-foreground/70' : 'text-muted',
              )}
            >
              {tt('nTabs', tabCount)}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && onClose && (
        <div
          className={`
            absolute right-2 top-1/2 hidden -translate-y-1/2
            group-hover:flex
          `}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className={`
              rounded p-1 text-muted
              hover:bg-accent/[calc(var(--accent-strength)*1%)]
              hover:text-accent
            `}
            title="Close Window"
            aria-label="Close Window"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}
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
}
