import { cn } from '@extension/ui/utils/cn'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface ModeTransitionEffectProps {
  /** Whether we're currently in multi-select mode */
  isMultiSelectMode: boolean
  /** Additional class names for the container */
  className?: string
}

type PulseState = { show: boolean; type: 'enter' | 'exit' }

/**
 * Visual effect component that provides dramatic feedback when
 * transitioning between selection modes.
 *
 * When entering multi-select mode:
 * - A subtle accent-colored pulse expands outward
 * - Creates a "power-up" or "activation" feeling
 * - Slow, deliberate animation (~400ms)
 *
 * When exiting multi-select mode:
 * - A quick fade-out
 * - Feels like "deactivating"
 * - Fast animation (~150ms)
 *
 * This component should be placed in the TabManagerShell to affect
 * the entire tab manager area during mode transitions.
 */
export const ModeTransitionEffect = ({
  isMultiSelectMode,
  className,
}: ModeTransitionEffectProps) => {
  const prefersReducedMotion = useReducedMotion()
  const [pulse, setPulse] = useState<PulseState>({ show: false, type: 'enter' })
  const previousModeRef = useRef(isMultiSelectMode)

  // Detect mode changes and trigger pulse animation
  // Using a callback pattern to batch state updates
  const checkModeChange = useCallback(() => {
    if (prefersReducedMotion) {
      previousModeRef.current = isMultiSelectMode
      return
    }

    const previousMode = previousModeRef.current
    previousModeRef.current = isMultiSelectMode

    // Detect mode change and trigger pulse
    if (isMultiSelectMode && !previousMode) {
      setPulse({ show: true, type: 'enter' })
    } else if (!isMultiSelectMode && previousMode) {
      setPulse({ show: true, type: 'exit' })
    }
  }, [isMultiSelectMode, prefersReducedMotion])

  // Run mode change detection on mount and when mode changes
  // Note: This setState-in-effect pattern is intentional for animation triggering -
  // we need to detect prop changes and trigger visual effects in response.
  useEffect(() => {
    checkModeChange() // eslint-disable-line react-hooks/set-state-in-effect
  }, [checkModeChange])

  const handleAnimationComplete = useCallback(() => {
    setPulse((prev) => ({ ...prev, show: false }))
  }, [])

  if (prefersReducedMotion) {
    return null
  }

  return (
    <AnimatePresence>
      {pulse.show && (
        <motion.div
          className={cn(
            'pointer-events-none absolute inset-0 z-50 overflow-hidden',
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={handleAnimationComplete}
        >
          {pulse.type === 'enter' ? (
            // Entering multi-select: expanding ring effect
            <motion.div
              className={`
                bg-accent/30 absolute left-1/2 top-1/2 h-32 w-32
                -translate-x-1/2 -translate-y-1/2 rounded-full
              `}
              initial={{
                scale: 0,
                opacity: 0.6,
              }}
              animate={{
                scale: 20,
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
              }}
            />
          ) : (
            // Exiting multi-select: quick fade
            <motion.div
              className="bg-background/30 absolute inset-0"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
