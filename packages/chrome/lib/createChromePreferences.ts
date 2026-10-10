import {
  applyPreferencePatch,
  defaultPreferences,
  normalizePreferences,
} from '@extension/core/preferences'
import type {
  PreferenceResource,
  PreferenceState,
} from '@extension/core/preferences'

export type ChromePreferencesApi = Pick<typeof chrome, 'storage'>

const storageKey = 'preference-storage-key'

export const createChromePreferences = (
  api: ChromePreferencesApi,
): PreferenceResource => {
  let snapshot: PreferenceState = { ...defaultPreferences }
  const listeners = new Set<() => void>()
  let running = false
  let generation = 0
  let changeRevision = 0
  let loadTask: Promise<void> | undefined
  let writes: Promise<void> = Promise.resolve()
  let removeListener: (() => void) | undefined

  const publish = (next: PreferenceState) => {
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  const start = (): Promise<void> => {
    if (running) return loadTask ?? Promise.resolve()
    running = true
    generation += 1
    const currentGeneration = generation
    const currentRevision = changeRevision
    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (
        !running ||
        generation !== currentGeneration ||
        area !== 'local' ||
        !changes[storageKey]
      ) {
        return
      }
      changeRevision += 1
      publish(normalizePreferences(changes[storageKey]?.newValue))
    }
    api.storage.onChanged.addListener(onChanged)
    removeListener = () => api.storage.onChanged.removeListener(onChanged)
    const task = api.storage.local
      .get(storageKey)
      .then((values) => {
        if (
          running &&
          generation === currentGeneration &&
          currentRevision === changeRevision
        ) {
          publish(normalizePreferences(values[storageKey]))
        }
      })
      .catch((error: unknown) => {
        if (generation === currentGeneration) {
          running = false
          removeListener?.()
          removeListener = undefined
          loadTask = undefined
        }
        throw error
      })
    loadTask = task
    return task
  }

  const write = (patch?: Partial<PreferenceState>) => {
    const currentGeneration = generation
    const task = writes
      .catch(() => undefined)
      .then(async () => {
        if (!running || generation !== currentGeneration) {
          throw new Error('The preference connection is not running.')
        }
        await loadTask
        if (!running || generation !== currentGeneration) {
          throw new Error('The preference connection was stopped.')
        }
        const next = patch
          ? applyPreferencePatch(snapshot, patch)
          : { ...defaultPreferences }
        const beforeWriteRevision = changeRevision
        if (patch) await api.storage.local.set({ [storageKey]: next })
        else await api.storage.local.remove(storageKey)
        if (
          running &&
          generation === currentGeneration &&
          beforeWriteRevision === changeRevision
        )
          publish(next)
      })
    writes = task
    return task
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start,
    set: write,
    reset: () => write(),
    dispose: () => {
      running = false
      generation += 1
      loadTask = undefined
      removeListener?.()
      removeListener = undefined
    },
  }
}
