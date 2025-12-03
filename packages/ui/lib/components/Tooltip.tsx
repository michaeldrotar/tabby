import { cn } from '../utils/cn'
import { useState } from 'react'
import type { ReactNode } from 'react'

type TooltipProps = {
  /** The content to show in the tooltip */
  content: ReactNode
  /** The element that triggers the tooltip on hover */
  children: ReactNode
  /** Additional class names for the tooltip container */
  className?: string
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Callback when the tooltip becomes visible (useful for fetching data) */
  onShow?: () => void
}

/**
 * A simple tooltip component that shows content on hover.
 * Supports an onShow callback for lazy-loading tooltip content.
 */
export const Tooltip = ({
  content,
  children,
  className,
  position = 'bottom',
  onShow,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)

  const handleMouseEnter = () => {
    setIsVisible(true)
    onShow?.()
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1',
  }

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && (
        <div
          className={cn(
            'absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-xs shadow-lg',
            'bg-gray-900 text-white',
            'dark:bg-gray-700',
            positionClasses[position],
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}
