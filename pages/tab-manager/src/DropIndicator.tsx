import { cn } from '@extension/ui'
import { memo } from 'react'

export type DropIndicatorProps = {
  show: boolean
  className?: string
}

/**
 * A visual indicator showing where a dragged item will be dropped.
 * Uses absolute positioning to avoid affecting layout flow,
 * which prevents the flashing/bouncing issue during drag.
 */
export const DropIndicator = memo(({ show, className }: DropIndicatorProps) => {
  return (
    <div
      className={cn(`pointer-events-none relative h-0 w-full`, className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          `
            absolute inset-x-0 top-0 h-2 -translate-y-1/2 rounded-full
            bg-accent/[calc(var(--accent-strength)*1%)] transition-opacity
            duration-100
          `,
          show ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
})
