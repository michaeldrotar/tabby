import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'
import { cn } from '../../utils/cn'

export type SidebarActionProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isExpanded: boolean
  isActive?: boolean
}

export const SidebarAction = ({
  icon,
  label,
  onClick,
  isExpanded,
  isActive,
}: SidebarActionProps) => {
  const content = (
    <button
      onClick={onClick}
      data-nav-type="action"
      className={cn(
        'group flex w-full items-center gap-3 rounded-md p-2 transition-all',
        isActive
          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      )}
    >
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
        {icon}
      </div>

      <div
        className={cn(
          'overflow-hidden whitespace-nowrap text-left text-sm transition-all duration-300',
          isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
        )}
      >
        {label}
      </div>
    </button>
  )

  if (isExpanded) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
