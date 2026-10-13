import { Tooltip, TooltipContent, TooltipTrigger } from '../../Tooltip'
import { cn } from '../../utils/cn'

export const creationItemFocusClass = `
  focus-visible:bg-accent/[calc(var(--accent-strength)*1%)]
  focus-visible:text-foreground focus-visible:ring-accent/70
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
`

export type SidebarActionProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
  createItem?: 'window'
  isExpanded: boolean
}

export const SidebarAction = ({
  icon,
  label,
  onClick,
  isExpanded,
  createItem,
}: SidebarActionProps) => {
  const content = (
    <button
      onClick={onClick}
      data-nav-type="action"
      data-create-item={createItem}
      aria-label={label}
      className={cn(
        `
          text-foreground group flex w-full items-center gap-3 overflow-clip
          rounded-md p-2 transition-colors
          hover:bg-highlighted/50
          focus:outline-none
        `,
        createItem
          ? creationItemFocusClass
          : `
            focus-visible:ring-accent/70 focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-inset
          `,
      )}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
        {icon}
      </div>

      {/* TODO: Fix this to toggle visible/invisible on the text, transition-[visibility] isn't working and hides the text too soon */}
      {/* Keep fixed width so the text doesn't move as the sidebar opens and closes to reveal the full content */}
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
