import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../../ContextMenu'
import { Favicon } from '../../Favicon'
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
            ? 'bg-gray-200 text-gray-900 dark:bg-slate-800 dark:text-slate-100'
            : isActive
              ? 'bg-blue-50 text-blue-900 dark:bg-indigo-500/15 dark:text-indigo-200'
              : 'text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800/50',
        )}
      >
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
          {activeTabUrl ? (
            <Favicon
              pageUrl={activeTabUrl}
              className="h-5 w-5 object-contain"
            />
          ) : (
            <div className="h-4 w-4 rounded-full bg-gray-400/50" />
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
          <span className="truncate text-xs text-gray-500 dark:text-slate-500">
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
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Close Window"
            aria-label="Close Window"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 18 12" />
            </svg>
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
