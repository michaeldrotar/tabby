import { ScrollArea } from '../../ScrollArea'
import { cn } from '../../utils/cn'

// Icons as components
const PanelLeftClose = ({
  size = 24,
  className,
}: {
  size?: number
  className?: string
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <path d="M9 3v18" />
    <path d="m16 15-3-3 3-3" />
  </svg>
)
const PanelLeftOpen = ({
  size = 24,
  className,
}: {
  size?: number
  className?: string
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <path d="M9 3v18" />
    <path d="m14 15 3-3-3-3" />
  </svg>
)

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
        'flex h-full flex-col bg-gray-50/50 transition-all duration-300 ease-in-out dark:bg-zinc-900/50',
        isExpanded ? 'w-64' : 'w-16',
        className,
      )}
    >
      {/* Top Sticky: Toggle Mode */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-800">
        <button
          onClick={onToggleExpand}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          title={isExpanded ? 'Collapse' : 'Expand'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeftOpen size={20} />
          )}
        </button>
        {isExpanded && windowCount !== undefined && (
          <span className="whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
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
