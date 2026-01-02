import { IS_DEV } from '@extension/env/const'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type ProfilerLogEntry = {
  id: string
  phase: 'mount' | 'update'
  duration: number
  timestamp: number
}

const logHistory: ProfilerLogEntry[] = []
const MAX_LOG_HISTORY = 100

const logRender = (id: string, phase: 'mount' | 'update', duration: number) => {
  const entry: ProfilerLogEntry = {
    id,
    phase,
    duration,
    timestamp: Date.now(),
  }

  // Keep history for analysis
  logHistory.push(entry)
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift()
  }

  // Color-coded logging based on duration
  const durationMs = duration.toFixed(2)
  const color =
    duration < 5
      ? 'color: #10B981' // green - fast
      : duration < 16
        ? 'color: #F59E0B' // amber - acceptable (within frame budget)
        : 'color: #EF4444' // red - slow (drops frames)

  console.log(`%c[Profiler] ${id} (${phase}) ${durationMs}ms`, color)
}

type ProfilerProps = {
  /** Identifier for this profiler instance */
  id: string
  /** Children to wrap with profiling */
  children: ReactNode
}

/**
 * Development-only profiler wrapper for React components.
 *
 * Uses performance.now() to measure render time since React's Profiler API
 * doesn't work with production React builds (used by @vitejs/plugin-react-swc).
 *
 * Pass `enabled={IS_DEV}` from the consuming page to ensure the check happens
 * at Vite bundle time, not at package build time.
 *
 * @example
 * ```tsx
 * import { IS_DEV } from '@extension/env/const'
 *
 * <Profiler id="TabManager" enabled={IS_DEV}>
 *   <TabManagerContent />
 * </Profiler>
 * ```
 */
export const Profiler = ({ id, children }: ProfilerProps) => {
  const renderStartRef = useRef<number>(0)
  const isMountedRef = useRef(false)
  const enabled = IS_DEV

  // Capture start time at beginning of render
  if (enabled) {
    // eslint-disable-next-line react-hooks/purity
    renderStartRef.current = performance.now()
  }

  useEffect(() => {
    if (!enabled) return

    const duration = performance.now() - renderStartRef.current
    const phase = isMountedRef.current ? 'update' : 'mount'
    isMountedRef.current = true

    logRender(id, phase, duration)
  })

  // When disabled, render children directly (no overhead)
  return <>{children}</>
}

/**
 * Get the profiler log history for analysis.
 */
export const getProfilerHistory = (): ProfilerLogEntry[] => {
  return [...logHistory]
}

/**
 * Clear the profiler log history.
 */
export const clearProfilerHistory = (): void => {
  logHistory.length = 0
}

/**
 * Get performance summary for a specific component.
 */
export const getProfilerSummary = (
  componentId: string,
): {
  renderCount: number
  avgDuration: number
  maxDuration: number
  minDuration: number
} | null => {
  const entries = logHistory.filter((e) => e.id === componentId)
  if (entries.length === 0) return null

  const durations = entries.map((e) => e.duration)
  return {
    renderCount: entries.length,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
  }
}

/**
 * Log a performance summary to the console.
 */
export const logProfilerSummary = (): void => {
  const componentIds = [...new Set(logHistory.map((e) => e.id))]

  console.group('%c[Profiler Summary]', 'color: #8B5CF6; font-weight: bold')

  for (const id of componentIds) {
    const summary = getProfilerSummary(id)
    if (summary) {
      const avgColor =
        summary.avgDuration < 5
          ? 'color: #10B981'
          : summary.avgDuration < 16
            ? 'color: #F59E0B'
            : 'color: #EF4444'

      console.log(
        `%c${id}: ${summary.renderCount} renders, avg ${summary.avgDuration.toFixed(2)}ms, max ${summary.maxDuration.toFixed(2)}ms`,
        avgColor,
      )
    }
  }

  console.groupEnd()
}
