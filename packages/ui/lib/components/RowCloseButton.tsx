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
        flex size-11 min-h-[44px] min-w-[44px] shrink-0 items-center
        justify-center rounded-sm text-muted transition-opacity
        hover:text-foreground
        focus:ring-0 focus:outline-hidden
        focus-visible:outline-hidden
      `,
      active
        ? 'opacity-100'
        : `
          opacity-0
          group-hover/closable-row:opacity-100
          group-has-focus-visible/closable-row:opacity-100
          group-data-[hover=true]/closable-row:opacity-100
        `,
      className,
    )}
  >
    <X className="size-4" />
  </button>
)
