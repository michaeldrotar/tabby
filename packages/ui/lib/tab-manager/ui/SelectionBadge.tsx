import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'
import { cn } from '../../utils/cn'

export interface SelectionBadgeProps {
  /** Number of selected windows */
  windowCount: number
  /** Number of selected groups */
  groupCount: number
  /** Number of selected tabs (direct selections, not contained in groups/windows) */
  tabCount: number
  /** Total tabs affected (including those in selected groups/windows) */
  totalTabsAffected?: number
  /** Additional class names */
  className?: string
}

/**
 * Selection Badge - A bold, eye-catching indicator of current selection state.
 *
 * Design philosophy:
 * - Big, readable, impossible to miss
 * - Spring animations for count changes create life and energy
 * - Color reinforces the selection action (accent color)
 * - Appears/disappears with smooth transitions
 */
export const SelectionBadge = ({
  windowCount,
  groupCount,
  tabCount,
  totalTabsAffected,
  className,
}: SelectionBadgeProps) => {
  const prefersReducedMotion = useReducedMotion()
  const totalSelected = windowCount + groupCount + tabCount

  // Generate the display text with smart formatting
  const badgeText = useMemo(() => {
    // Nothing selected
    if (totalSelected === 0) return null

    const parts: string[] = []

    // Windows first (most impactful)
    if (windowCount > 0) {
      parts.push(`${windowCount} window${windowCount !== 1 ? 's' : ''}`)
    }

    // Groups second
    if (groupCount > 0) {
      parts.push(`${groupCount} group${groupCount !== 1 ? 's' : ''}`)
    }

    // Individual tabs
    if (tabCount > 0) {
      parts.push(`${tabCount} tab${tabCount !== 1 ? 's' : ''}`)
    }

    return parts.join(', ')
  }, [windowCount, groupCount, tabCount, totalSelected])

  // Calculate affected tabs text
  const affectedText = useMemo(() => {
    if (!totalTabsAffected || totalTabsAffected === tabCount) return null
    return `(${totalTabsAffected} tabs total)`
  }, [totalTabsAffected, tabCount])

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: -4,
      transition: {
        duration: 0.15,
        ease: 'easeOut' as const,
      },
    },
  }

  if (totalSelected === 0) {
    return null
  }

  const content = (
    <div
      className={cn(
        // Bold, prominent styling
        `
          text-accent-foreground bg-accent shadow-accent/25 inline-flex
          items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold
          shadow-lg
        `,
        className,
      )}
    >
      {/* Selection count with visual emphasis */}
      <span className="tabular-nums">{badgeText}</span>

      {/* Affected tabs indicator */}
      {affectedText && (
        <span className="text-accent-foreground/70">{affectedText}</span>
      )}
    </div>
  )

  if (prefersReducedMotion) {
    return content
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={badgeText} // Re-animate when text changes
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Utility to calculate selection badge text from selection sets.
 * Can be used outside the component for testing or other purposes.
 */
export const getSelectionBadgeText = (
  windowIds: Set<number>,
  groupIds: Set<number>,
  tabIds: Set<number>,
): string | null => {
  const windowCount = windowIds.size
  const groupCount = groupIds.size
  const tabCount = tabIds.size
  const totalSelected = windowCount + groupCount + tabCount

  if (totalSelected === 0) return null

  const parts: string[] = []

  if (windowCount > 0) {
    parts.push(`${windowCount} window${windowCount !== 1 ? 's' : ''}`)
  }
  if (groupCount > 0) {
    parts.push(`${groupCount} group${groupCount !== 1 ? 's' : ''}`)
  }
  if (tabCount > 0) {
    parts.push(`${tabCount} tab${tabCount !== 1 ? 's' : ''}`)
  }

  return parts.join(', ')
}
