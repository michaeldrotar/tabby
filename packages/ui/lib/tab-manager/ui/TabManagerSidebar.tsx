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
        'bg-input/30 flex h-full flex-col overflow-x-clip transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-16',
        className,
      )}
    >
      {/* Top Sticky: Toggle Mode */}
      <div className="flex h-14 w-64 flex-shrink-0 items-center justify-between px-3">
        <button
          onClick={onToggleExpand}
          className="text-muted hover:bg-highlighted/50 hover:text-foreground focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <PanelLeftCloseIcon size={20} />
          ) : (
            <PanelLeftOpenIcon size={20} />
          )}
        </button>
        {windowCount && (
          <span
            className={cn(
              'text-muted whitespace-nowrap text-xs font-medium transition-[visibility] duration-300',
              isExpanded ? 'visible' : 'invisible',
            )}
          >
            {windowCount} Windows
          </span>
        )}
      </div>

      <div className="bg-border h-[1px] w-full"></div>

      {/* Middle Scrollable: Window List */}
      <ScrollArea className="flex-1 py-2" orientation="vertical">
        <div className="flex flex-col gap-2 px-2 py-1">{windowList}</div>
      </ScrollArea>

      {/* Bottom Sticky: Actions */}
      <div className="border-border flex flex-shrink-0 flex-col gap-1 border-t p-2">
        {actions}
      </div>
    </div>
  )
}
