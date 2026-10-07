import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearDiagnostics,
  getDiagnosticsHistory,
  getDiagnosticsSummary,
  MAX_DIAGNOSTIC_ENTRIES,
  recordDiagnosticEvent,
  recordDiagnosticRender,
  startDiagnostics,
  stopDiagnostics,
} from './devDiagnostics.js'

describe('development diagnostics', () => {
  beforeEach(() => {
    stopDiagnostics()
    clearDiagnostics()
  })

  it('records event and render summaries only during a session', () => {
    recordDiagnosticEvent('tabs.onUpdated')
    expect(getDiagnosticsHistory()).toEqual([])

    startDiagnostics()
    recordDiagnosticEvent('tabs.onUpdated', { tabId: 42 })
    recordDiagnosticEvent('tabs.onUpdated', { tabId: 42 })
    recordDiagnosticRender('TabItemPane:42', 'update', 3, 8)

    expect(getDiagnosticsSummary()).toEqual({
      events: [{ name: 'tabs.onUpdated', count: 2 }],
      renders: [
        {
          name: 'TabItemPane:42',
          count: 1,
          averageDuration: 3,
          maxDuration: 3,
        },
      ],
    })

    expect(stopDiagnostics()).toHaveLength(3)
    recordDiagnosticEvent('tabs.onCreated')
    expect(getDiagnosticsHistory()).toHaveLength(3)
  })

  it('keeps a bounded recording and starts each session fresh', () => {
    startDiagnostics()
    for (let sequence = 0; sequence <= MAX_DIAGNOSTIC_ENTRIES; sequence += 1) {
      recordDiagnosticEvent('tabs.onUpdated', { sequence })
    }

    const history = getDiagnosticsHistory()
    expect(history).toHaveLength(MAX_DIAGNOSTIC_ENTRIES)
    expect(history[0]?.sequence).toBe(2)

    startDiagnostics()
    expect(getDiagnosticsHistory()).toEqual([])
  })
})
