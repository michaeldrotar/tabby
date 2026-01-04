import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

export type ModeTransitionPhase = 'idle' | 'entering' | 'exiting'

/**
 * Hook to track mode transitions and provide animation phase state.
 *
 * Returns the current transition phase which can be used to trigger
 * animations when entering or exiting multi-select mode.
 */
export const useSelectionModeAnimation = (isMultiSelectMode: boolean) => {
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<ModeTransitionPhase>('idle')
  const previousModeRef = useRef(isMultiSelectMode)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Memoized function to handle mode change detection
  const handleModeChange = useCallback(() => {
    // Skip animations if user prefers reduced motion
    if (prefersReducedMotion) {
      previousModeRef.current = isMultiSelectMode
      return
    }

    const previousMode = previousModeRef.current
    previousModeRef.current = isMultiSelectMode

    // Detect mode change
    if (isMultiSelectMode && !previousMode) {
      // Entering multi-select mode
      setPhase('entering')
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setPhase('idle'), 400)
    } else if (!isMultiSelectMode && previousMode) {
      // Exiting multi-select mode
      setPhase('exiting')
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setPhase('idle'), 250)
    }
  }, [isMultiSelectMode, prefersReducedMotion])

  // Note: This setState-in-effect pattern is intentional for animation phase tracking -
  // we need to detect prop changes and trigger animation states in response.
  useEffect(() => {
    handleModeChange() // eslint-disable-line react-hooks/set-state-in-effect
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [handleModeChange])

  return {
    phase,
    isAnimating: phase !== 'idle',
    prefersReducedMotion: prefersReducedMotion ?? false,
  }
}
