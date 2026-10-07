import { getEnv } from '@extension/env/getEnv'

export const MAX_DIAGNOSTIC_ENTRIES = 1000
export const DEV_DIAGNOSTICS_ENABLED = getEnv()['IS_DEV']

export type DiagnosticDetails = Readonly<
  Record<string, boolean | number | string | null>
>
export type DiagnosticRenderPhase = 'mount' | 'update' | 'nested-update'

type DiagnosticEntryMetadata = {
  sequence: number
  timestamp: number
}

export type DiagnosticEventEntry = DiagnosticEntryMetadata & {
  type: 'event'
  name: string
  details?: DiagnosticDetails
}

export type DiagnosticRenderEntry = DiagnosticEntryMetadata & {
  type: 'render'
  name: string
  phase: DiagnosticRenderPhase
  actualDuration: number
  baseDuration: number
}

export type DiagnosticEntry = DiagnosticEventEntry | DiagnosticRenderEntry

type DiagnosticEntryInput =
  | Omit<DiagnosticEventEntry, keyof DiagnosticEntryMetadata>
  | Omit<DiagnosticRenderEntry, keyof DiagnosticEntryMetadata>

export type DiagnosticsSummary = {
  events: { name: string; count: number }[]
  renders: {
    name: string
    count: number
    averageDuration: number
    maxDuration: number
  }[]
}

const entries: DiagnosticEntry[] = []
let recording = false
let nextSequence = 1

export const isDiagnosticsRecording = (): boolean => recording

export const startDiagnostics = (): void => {
  entries.length = 0
  nextSequence = 1
  recording = true
}

export const stopDiagnostics = (): DiagnosticEntry[] => {
  recording = false
  return getDiagnosticsHistory()
}

export const clearDiagnostics = (): void => {
  entries.length = 0
  nextSequence = 1
}

const appendEntry = (entry: DiagnosticEntryInput): void => {
  if (!recording) return

  if (entries.length === MAX_DIAGNOSTIC_ENTRIES) entries.shift()
  entries.push({
    ...entry,
    sequence: nextSequence++,
    timestamp: Date.now(),
  })
}

export const recordDiagnosticEvent = (
  name: string,
  details?: DiagnosticDetails,
): void => {
  appendEntry({ type: 'event', name, details })
}

export const recordDiagnosticRender = (
  name: string,
  phase: DiagnosticRenderPhase,
  actualDuration: number,
  baseDuration: number,
): void => {
  appendEntry({
    type: 'render',
    name,
    phase,
    actualDuration,
    baseDuration,
  })
}

export const getDiagnosticsHistory = (): DiagnosticEntry[] =>
  entries.map((entry) =>
    entry.type === 'event' && entry.details
      ? { ...entry, details: { ...entry.details } }
      : { ...entry },
  )

export const getDiagnosticsSummary = (): DiagnosticsSummary => {
  const eventCounts = new Map<string, number>()
  const renderCounts = new Map<
    string,
    { count: number; totalDuration: number; maxDuration: number }
  >()

  for (const entry of entries) {
    if (entry.type === 'event') {
      eventCounts.set(entry.name, (eventCounts.get(entry.name) ?? 0) + 1)
      continue
    }

    const summary = renderCounts.get(entry.name) ?? {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
    }
    summary.count += 1
    summary.totalDuration += entry.actualDuration
    summary.maxDuration = Math.max(summary.maxDuration, entry.actualDuration)
    renderCounts.set(entry.name, summary)
  }

  return {
    events: [...eventCounts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    renders: [...renderCounts]
      .map(([name, summary]) => ({
        name,
        count: summary.count,
        averageDuration: summary.totalDuration / summary.count,
        maxDuration: summary.maxDuration,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
}
