import { PanelLeftCloseIcon, PanelLeftOpenIcon } from '../../icons'
import { ScrollArea } from '../../ScrollArea'
import { cn } from '../../utils/cn'

export type TabManagerSidebarProps = {
  isExpanded: boolean
  onToggleExpand: () => void
  windowList: React.ReactNode
  actions: React.ReactNode
  windowCount?: number
  className?: string
}

export const TabManagerSidebar = ({
  isExpanded,
  onToggleExpand,
  windowList,
  actions,
  windowCount,
  className,
}: TabManagerSidebarProps) => {
  return (
    <div
      className={cn(
        'flex h-full flex-col bg-gray-50/50 transition-all duration-300 ease-in-out dark:bg-slate-950',
        isExpanded ? 'w-64' : 'w-16',
        className,
      )}
    >
      {/* Top Sticky: Toggle Mode */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-slate-800">
        <button
          onClick={onToggleExpand}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <PanelLeftCloseIcon size={20} />
          ) : (
            <PanelLeftOpenIcon size={20} />
          )}
        </button>
        {isExpanded && windowCount !== undefined && (
          <span className="whitespace-nowrap text-xs font-medium text-gray-500 dark:text-slate-500">
            {windowCount} Windows
          </span>
        )}
      </div>

      {/* Middle Scrollable: Window List */}
      <ScrollArea className="flex-1 py-2" orientation="vertical">
        <div className="flex flex-col gap-2 px-2">{windowList}</div>
      </ScrollArea>

      {/* Bottom Sticky: Actions */}
      <div className="flex flex-shrink-0 flex-col gap-1 border-t border-gray-200 p-2 dark:border-gray-800">
        {actions}
      </div>
    </div>
  )
}
