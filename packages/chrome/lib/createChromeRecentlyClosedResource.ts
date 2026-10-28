import { normalizeClosedSessions } from './closedSessions.js'
import type {
  RecentlyClosedResource,
  RecentlyClosedSnapshot,
} from '@extension/core/recentlyClosed'

export const createChromeRecentlyClosedResource = (
  api: Pick<typeof chrome, 'sessions' | 'runtime'>,
): RecentlyClosedResource => {
  let snapshot: RecentlyClosedSnapshot = { status: 'loading', sessions: [] }
  const listeners = new Set<() => void>()
  let active = false
  let generation = 0
  let revision = 0
  let started: Promise<void> | undefined
  const publish = (next: RecentlyClosedSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  const refresh = async () => {
    if (!active) return
    const operation = generation
    const request = ++revision
    try {
      const sessions = await api.sessions.getRecentlyClosed()
      if (!active || operation !== generation || request !== revision) return
      publish({
        ...snapshot,
        status: 'ready',
        error: snapshot.status === 'error' ? undefined : snapshot.error,
        sessions: normalizeClosedSessions(sessions, api.runtime),
      })
    } catch {
      if (!active || operation !== generation || request !== revision) return
      publish({
        ...snapshot,
        status: 'error',
        error: 'Could not load recently closed items. Try again.',
      })
    }
  }
  const changed = () => {
    void refresh()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start: () => {
      if (started) return started
      active = true
      generation++
      publish({ status: 'loading', sessions: [] })
      api.sessions.onChanged.addListener(changed)
      started = refresh()
      return started
    },
    dispose: () => {
      active = false
      generation++
      started = undefined
      api.sessions.onChanged.removeListener(changed)
      listeners.clear()
    },
    refresh: async () => {
      publish({ ...snapshot, error: undefined })
      await refresh()
    },
    restore: async (sessionId) => {
      if (!active || snapshot.restoringSessionId) return
      const operation = generation
      publish({ ...snapshot, restoringSessionId: sessionId, error: undefined })
      try {
        await api.sessions.restore(sessionId)
      } catch {
        if (active && operation === generation)
          publish({
            ...snapshot,
            error:
              'Could not restore this item. It may no longer be available in Chrome.',
          })
      } finally {
        if (active && operation === generation) {
          await refresh()
          if (active && operation === generation)
            publish({ ...snapshot, restoringSessionId: undefined })
        }
      }
    },
  }
}
