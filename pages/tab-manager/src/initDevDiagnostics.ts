import { getEnv } from '@extension/env/getEnv'
import {
  clearDiagnostics,
  getDiagnosticsHistory,
  getDiagnosticsSummary,
  startDiagnostics,
  stopDiagnostics,
} from '@extension/shared/devDiagnostics'

const IS_DEV = getEnv()['IS_DEV']

declare global {
  interface Window {
    tabbyDiagnostics?: {
      /** Start a fresh event and React Profiler recording. */
      start: typeof startDiagnostics
      /** Stop recording and return the captured entries. */
      stop: typeof stopDiagnostics
      /** Return a copy of the captured entries. */
      history: typeof getDiagnosticsHistory
      /** Summarize event counts and React render timings. */
      summary: typeof getDiagnosticsSummary
      /** Clear captured entries without stopping an active recording. */
      clear: typeof clearDiagnostics
    }
  }
}

export const initDevDiagnostics = (): void => {
  if (!IS_DEV) return

  window.tabbyDiagnostics = {
    start: startDiagnostics,
    stop: stopDiagnostics,
    history: getDiagnosticsHistory,
    summary: getDiagnosticsSummary,
    clear: clearDiagnostics,
  }

  console.info(
    '%c[Dev] Diagnostics available. Use tabbyDiagnostics.start() to record.',
    'color: #8B5CF6',
  )
}
