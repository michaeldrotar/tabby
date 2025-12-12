import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../../ContextMenu'
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
        className={cn(
          'flex w-full items-center gap-3 rounded-md p-2 outline-none transition-all focus:outline-none',
          isSelected
            ? 'bg-surface text-foreground shadow-surface'
            : isActive
              ? 'bg-accent/10 text-foreground'
              : 'text-muted-foreground hover:bg-surface-muted/70',
        )}
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          {activeTabUrl ? (
            <Favicon
              pageUrl={activeTabUrl}
              className="h-5 w-5 object-contain"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
          )}
        </div>

        <div
          className={cn(
            'flex flex-1 flex-col overflow-hidden text-left transition-all duration-300',
            isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
          )}
        >
          <span className="truncate text-sm font-medium leading-tight">
            {title}
          </span>
           <span className="truncate text-xs text-muted-foreground">
            {tt('nTabs', tabCount)}
          </span>
        </div>
        {isExpanded && <div className="hidden w-4 group-hover:flex" />}
      </button>

      {isExpanded && onClose && (
         <div className="absolute right-2 top-1/2 hidden -translate-y-1/2 group-hover:flex">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="rounded p-1 text-muted-foreground hover:bg-accent-soft/60 hover:text-accent"
            title="Close Window"
            aria-label="Close Window"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}
    </div>
  )

  const trigger = <ContextMenuTrigger asChild>{button}</ContextMenuTrigger>

  return (
    <ContextMenu>
      {isExpanded ? (
        trigger
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">
            {title} ({tabCount} tabs)
          </TooltipContent>
        </Tooltip>
      )}
      <ContextMenuContent>
        <ContextMenuItem onSelect={onClose}>Close Window</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
