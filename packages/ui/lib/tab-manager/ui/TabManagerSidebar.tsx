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
        'bg-muted/30 flex h-full flex-col transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-16',
        className,
      )}
    >
      {/* Top Sticky: Toggle Mode */}
      <div className="border-border flex h-14 flex-shrink-0 items-center justify-between border-b px-3">
        <button
          onClick={onToggleExpand}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md transition-colors"
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
          <span className="text-muted-foreground whitespace-nowrap text-xs font-medium">
            {windowCount} Windows
          </span>
        )}
      </div>

      {/* Middle Scrollable: Window List */}
      <ScrollArea className="flex-1 py-2" orientation="vertical">
        <div className="flex flex-col gap-2 px-2">{windowList}</div>
      </ScrollArea>

      {/* Bottom Sticky: Actions */}
      <div className="border-border flex flex-shrink-0 flex-col gap-1 border-t p-2">
        {actions}
      </div>
    </div>
  )
}
