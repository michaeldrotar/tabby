import { createAsyncQueue } from './asyncQueue.js'
import type { PreferenceState } from './preferences.js'

export const WALKTHROUGH_VERSION = '1.9.0'
export type WalkthroughId = 'omnibar' | 'tab-manager'

export const discoveryTips = [
  {
    id: 'follow-windows',
    title: 'Make switching windows the default',
    description:
      'You use Shift to follow moves. You can always switch windows when picking a window or moving tabs and groups. Hold Shift to stay instead.',
    action: 'Always switch windows',
    patch: { tabManagerWindowClickBehavior: 'switch' },
  },
  {
    id: 'stay-in-window',
    title: 'Keep your current window in front',
    description:
      'You use Shift to stay after moves. You can always stay in your current window when picking a window or moving tabs and groups. Hold Shift to follow instead.',
    action: 'Always stay in this window',
    patch: { tabManagerWindowClickBehavior: 'view' },
  },
  {
    id: 'stable-window-icons',
    title: 'Give unnamed windows a stable identity',
    description:
      'Use the first tab’s title and icon so unnamed windows stay recognizable as you switch tabs. The header pencil gives each window its own name, icon, and color.',
    action: 'Use the first tab',
    patch: { tabManagerCompactIconMode: 'first' },
  },
  {
    id: 'batch-selection',
    title: 'Act on your whole selection',
    description:
      'Cmd/Ctrl-click toggles tabs and Shift-click selects a range. Open More actions or right-click to move, group, pin, or close the selection. Escape returns to the active tab.',
  },
  {
    id: 'move-groups',
    title: 'Move a whole group together',
    description:
      'Moving a group keeps its tabs together. You can also drag a group over the window header to reveal your windows, then drop it on a destination. Shift reverses whether you follow.',
  },
  {
    id: 'search-scopes',
    title: 'Change search scope from the keyboard',
    description:
      'Press Tab in search, then pick a scope with its letter or the arrow keys and Enter. Your search text stays in place. Escape closes the scope choices.',
  },
] as const satisfies readonly {
  id: string
  title: string
  description: string
  action?: string
  patch?: Partial<PreferenceState>
}[]

export type DiscoveryTip = (typeof discoveryTips)[number]
export type DiscoveryTipId = DiscoveryTip['id']
export type PendingTip = { id: DiscoveryTipId; windowId?: number }
export type DiscoverySnapshot = {
  loaded: boolean
  tipsEnabled: boolean
  completedTours: readonly WalkthroughId[]
  seenTips: readonly DiscoveryTipId[]
  pendingTips: readonly PendingTip[]
}
export interface DiscoveryPersistence {
  withLock: (action: () => Promise<void>) => Promise<void>
  load: () => Promise<Record<string, unknown>>
  save: (values: Record<string, unknown>) => Promise<void>
  subscribe: (listener: (values: Record<string, unknown>) => void) => () => void
}
export type DiscoveryResource = ReturnType<typeof createDiscoveryResource>

const tourKey = (id: WalkthroughId) => `tour-${WALKTHROUGH_VERSION}-${id}`
const tipKey = (id: DiscoveryTipId) => `tip-${id}`
export const discoveryStorageKeys = [
  'tips-enabled',
  'usage',
  'quiet-day',
  tourKey('omnibar'),
  tourKey('tab-manager'),
  ...discoveryTips.map(({ id }) => tipKey(id)),
]

const dayAt = (time: number) => {
  const date = new Date(time)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}
const recordDays = (value: unknown, day: string, limit: number) => {
  const days = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  return [...new Set([...days, day])].slice(0, limit)
}
const recordValue = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const recordUsage = (value: unknown, time: number) => {
  const usage = recordValue(value)
  return {
    firstAt:
      typeof usage.firstAt === 'number' && Number.isFinite(usage.firstAt)
        ? Math.min(usage.firstAt, time)
        : time,
    days: recordDays(usage.days, dayAt(time), 3),
  }
}

/** Each completion has its own storage key so separate panels cannot overwrite it. */
export const createDiscoveryResource = (
  persistence?: DiscoveryPersistence,
  now = Date.now,
) => {
  let values: Record<string, unknown> = {}
  let snapshot: DiscoverySnapshot = {
    loaded: false,
    tipsEnabled: true,
    completedTours: [],
    seenTips: [],
    pendingTips: [],
  }
  const listeners = new Set<() => void>()
  const writes = createAsyncQueue()
  let task: Promise<void> | undefined
  let unsubscribe: (() => void) | undefined
  let generation = 0
  const publish = (loaded = snapshot.loaded) => {
    const next: DiscoverySnapshot = {
      loaded,
      tipsEnabled: values['tips-enabled'] !== false,
      completedTours: (['omnibar', 'tab-manager'] as const).filter(
        (id) => values[tourKey(id)] === true,
      ),
      seenTips: discoveryTips
        .filter(({ id }) => values[tipKey(id)] === true)
        .map(({ id }) => id),
      pendingTips: discoveryTips.flatMap(({ id }) => {
        const value = values[tipKey(id)]
        if (
          !value ||
          typeof value !== 'object' ||
          !('windowId' in value) ||
          !('offeredDay' in value) ||
          value.offeredDay !== dayAt(now()) ||
          (recordValue(values['quiet-day']).day === dayAt(now()) &&
            recordValue(values['quiet-day']).reason === 'tour')
        )
          return []
        const windowId = value.windowId
        return windowId === null ||
          (typeof windowId === 'number' &&
            Number.isSafeInteger(windowId) &&
            windowId >= 0)
          ? [{ id, ...(windowId === null ? {} : { windowId }) }]
          : []
      }),
    }
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return
    snapshot = next
    listeners.forEach((listener) => listener())
  }
  const start = () => {
    if (task) return task
    const operation = ++generation
    const changed = new Set<string>()
    unsubscribe = persistence?.subscribe((patch) => {
      if (operation !== generation) return
      Object.keys(patch).forEach((key) => changed.add(key))
      values = { ...values, ...patch }
      publish()
    })
    task = (async () => {
      try {
        const loaded = await persistence?.load()
        if (operation !== generation) return
        values = {
          ...values,
          ...loaded,
          ...Object.fromEntries([...changed].map((key) => [key, values[key]])),
        }
        const usage = recordValue(values.usage)
        const time = now()
        const nextUsage = recordUsage(usage, time)
        if (JSON.stringify(usage) !== JSON.stringify(nextUsage)) {
          await persistence?.save({ usage: nextUsage })
          if (operation !== generation) return
          values = { ...values, usage: nextUsage }
        }
        publish(true)
      } catch (error) {
        if (operation === generation) {
          unsubscribe?.()
          task = undefined
        }
        throw error
      }
    })()
    return task
  }
  const write = (getPatch: () => Record<string, unknown>) => {
    const operation = generation
    return writes.run(async () => {
      await task
      const save = async () => {
        if (operation !== generation || !snapshot.loaded)
          throw new Error('Tips are not connected yet. Try again.')
        if (persistence) {
          const stored = await persistence.load()
          if (operation !== generation) return
          values = { ...values, ...stored }
          publish()
        }
        const patch = Object.fromEntries(
          Object.entries(getPatch()).filter(
            ([key, value]) =>
              JSON.stringify(values[key]) !== JSON.stringify(value),
          ),
        )
        if (!Object.keys(patch).length) return
        await persistence?.save(patch)
        if (operation !== generation) return
        values = { ...values, ...patch }
        publish()
      }
      if (persistence) await persistence.withLock(save)
      else await save()
    })
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start,
    completeTour: (id: WalkthroughId) =>
      write(() => ({
        [tourKey(id)]: true,
        'quiet-day': { day: dayAt(now()), reason: 'tour' },
      })),
    restartTour: (id: WalkthroughId) => write(() => ({ [tourKey(id)]: false })),
    setTipsEnabled: (enabled: boolean) =>
      write(() => ({ 'tips-enabled': enabled })),
    offerTip: (id: DiscoveryTipId, windowId?: number) =>
      write(() => {
        const value = values[tipKey(id)]
        if (!snapshot.tipsEnabled || value === true) return {}
        const previous = recordValue(value)
        if ('windowId' in previous) return {}
        const time = now()
        const day = dayAt(time)
        const uses = Math.min(
          3,
          (typeof previous.uses === 'number' ? previous.uses : 0) + 1,
        )
        const days = recordDays(previous.days, day, 2)
        const usage = recordUsage(values.usage, time)
        const experienced =
          usage.days.length >= 3 && time - usage.firstAt >= 2 * 86400000
        const tour = id === 'search-scopes' ? 'omnibar' : 'tab-manager'
        const eligible =
          experienced &&
          uses >= 3 &&
          days.length >= 2 &&
          snapshot.completedTours.includes(tour) &&
          recordValue(values['quiet-day']).day !== day
        return {
          usage,
          [tipKey(id)]: {
            uses,
            days,
            ...(eligible
              ? { windowId: windowId ?? null, offeredDay: day }
              : {}),
          },
          ...(eligible ? { 'quiet-day': { day, reason: 'tip' } } : {}),
        }
      }),
    dismissTip: (id: DiscoveryTipId) => write(() => ({ [tipKey(id)]: true })),
    dispose: () => {
      generation++
      unsubscribe?.()
      unsubscribe = undefined
      task = undefined
      snapshot = { ...snapshot, loaded: false }
    },
  }
}
