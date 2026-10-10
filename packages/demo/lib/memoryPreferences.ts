import { defaultPreferences } from '@extension/core'
import type { PreferenceResource, PreferenceState } from '@extension/core'

export const createMemoryPreferences = (
  initial: Partial<PreferenceState> = {},
): PreferenceResource & {
  restoreSnapshot: (snapshot: PreferenceState) => void
} => {
  let snapshot = { ...defaultPreferences, ...initial }
  const listeners = new Set<() => void>()
  const publish = (next: PreferenceState) => {
    snapshot = { ...next }
    listeners.forEach((listener) => listener())
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: async (patch) => publish({ ...snapshot, ...patch }),
    start: async () => {},
    dispose: () => listeners.clear(),
    restoreSnapshot: publish,
  }
}
