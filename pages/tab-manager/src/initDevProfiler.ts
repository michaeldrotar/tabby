import {
  clearProfilerHistory,
  getProfilerHistory,
  getProfilerSummary,
  logProfilerSummary,
} from '@extension/dev-utils/Profiler'
import { IS_DEV } from '@extension/env/const'

/**
 * Exposes profiler utilities to the browser console in development mode.
 *
 * After importing this file, you can use these commands in the browser console:
 * - `tabbyProfiler.summary()` - Log a summary of all profiled components
 * - `tabbyProfiler.history()` - Get the raw profiler history array
 * - `tabbyProfiler.get('ComponentName')` - Get stats for a specific component
 * - `tabbyProfiler.clear()` - Clear the profiler history
 *
 * @example
 * // In browser console:
 * tabbyProfiler.summary()
 * tabbyProfiler.get('TabItemPane')
 */
declare global {
  interface Window {
    tabbyProfiler?: {
      /** Log a summary of all profiled components */
      summary: () => void
      /** Get the raw profiler history */
      history: () => ReturnType<typeof getProfilerHistory>
      /** Get summary for a specific componentId */
      get: (componentId: string) => ReturnType<typeof getProfilerSummary> | null
      /** Clear profiler history */
      clear: () => void
    }
  }
}

export const initDevProfiler = () => {
  if (!IS_DEV) return

  window.tabbyProfiler = {
    summary: logProfilerSummary,
    history: getProfilerHistory,
    get: getProfilerSummary,
    clear: clearProfilerHistory,
  }

  console.log(
    '%c[Dev] Profiler available. Use tabbyProfiler.summary() to see render stats.',
    'color: #8B5CF6',
  )
}
