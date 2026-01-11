import { cn } from '@extension/ui'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface SelectionFocusRingProps {
  /** Whether this item is selected */
  selected: boolean
  /** Whether we're in multi-select mode */
  isMultiSelectMode: boolean
  /** Children to wrap with the focus ring */
  children: ReactNode
  /** Additional class names */
  className?: string
}

/**
 * Spring configurations for different animation contexts.
 *
 * "Powerful" spring for entering multi-select - slow, noticeable, with slight overshoot
 * "Snappy" spring for exiting - fast, responsive
 */
const springs = {
  // Entering multi-select: slow, powerful, deliberate
  // This should feel like "activating a special mode"
  enter: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 20,
    mass: 1.2,
    // Results in ~400ms duration with gentle overshoot
  },
  // Exiting multi-select: quick, snappy return to normal
  exit: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
    mass: 0.8,
    // Results in ~200ms duration, minimal overshoot
  },
}

/**
 * Animated wrapper that provides mode-aware visual effects.
 *
 * When entering multi-select mode:
 * - The container briefly scales up (1.02) with a spring overshoot
 * - Creates a "the UI is unlocking" feeling
 *
 * When exiting multi-select mode:
 * - Quick snap back to normal
 * - Feels responsive and conclusive
 *
 * The actual focus ring is still handled by CSS :focus-visible,
 * but this wrapper provides the mode transition animation.
 */
export const SelectionFocusRing = ({
  selected: _selected,
  isMultiSelectMode,
  children,
  className,
}: SelectionFocusRingProps) => {
  const prefersReducedMotion = useReducedMotion()

  // Animation variants for mode transitions
  const variants = {
    // Default mode: normal scale
    default: {
      scale: 1,
      transition: springs.exit,
    },
    // Multi-select mode: subtle scale-up to signify "activated" state
    multiSelect: {
      scale: 1.01,
      transition: springs.enter,
    },
  }

  if (prefersReducedMotion) {
    // No motion wrapper, just pass through
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn('origin-center', className)}
      initial={false}
      animate={isMultiSelectMode ? 'multiSelect' : 'default'}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
