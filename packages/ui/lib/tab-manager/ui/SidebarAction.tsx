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
      aria-label={label}
      className={cn(
        'focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background group flex w-full items-center gap-3 rounded-md p-2 transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isActive
          ? 'bg-accent/[calc(var(--accent-strength)*1%)] text-foreground'
          : 'text-foreground hover:bg-highlighted/50',
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
