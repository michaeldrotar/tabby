import { X } from 'lucide-react'
import { cn } from '../utils/cn'

export const RowCloseButton = ({
  label,
  title = label,
  active = false,
  className,
  onClose,
}: {
  label: string
  title?: string
  active?: boolean
  className?: string
  onClose: () => void
}) => (
  <button
    type="button"
    tabIndex={-1}
    aria-label={label}
    title={title}
    onClick={(event) => {
      event.stopPropagation()
      onClose()
    }}
    className={cn(
      `
        text-muted flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0
        items-center justify-center rounded transition-opacity
        hover:text-foreground
        focus:outline-none focus:ring-0
        focus-visible:outline-none
      `,
      active
        ? 'opacity-100'
        : `
          opacity-0
          group-hover/closable-row:opacity-100
          group-has-[:focus-visible]/closable-row:opacity-100
          group-data-[hover=true]/closable-row:opacity-100
        `,
      className,
    )}
  >
    <X className="h-4 w-4" />
  </button>
)
