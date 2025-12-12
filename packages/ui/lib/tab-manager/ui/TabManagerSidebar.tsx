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
        'flex h-full flex-col bg-surface-muted/60 transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-16',
        className,
      )}
    >
      {/* Top Sticky: Toggle Mode */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border/60 px-3">
        <button
          onClick={onToggleExpand}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
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
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            {windowCount} Windows
          </span>
        )}
      </div>

      {/* Middle Scrollable: Window List */}
      <ScrollArea className="flex-1 py-2" orientation="vertical">
        <div className="flex flex-col gap-2 px-2">{windowList}</div>
      </ScrollArea>

      {/* Bottom Sticky: Actions */}
      <div className="flex flex-shrink-0 flex-col gap-1 border-t border-border/60 p-2">
        {actions}
      </div>
    </div>
  )
}
