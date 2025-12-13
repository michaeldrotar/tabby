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
}: SidebarActionProps) => {
  const content = (
    <button
      onClick={onClick}
      data-nav-type="action"
      aria-label={label}
      className={cn(
        'focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background',
        'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'group flex w-full items-center gap-3 rounded-md p-2 transition-colors',
        'text-foreground hover:bg-highlighted/50 overflow-clip',
      )}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
        {icon}
      </div>

      {/* TODO: Fix this to toggle visible/invisible on the text, transition-[visibility] isn't working and hides the text too soon */}
      <div className={cn('w-44 whitespace-nowrap text-left text-sm')}>
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
