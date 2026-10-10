import type { TabManagerView } from './view'

export type NotificationMessage = { message: string; kind?: 'info' | 'error' }
export type NotificationEntry = NotificationMessage & {
  id: number
  remainingMs: number | null
  startedAt: number | null
}
export type NotificationState = {
  items: NotificationEntry[]
  nextId: number
  paused: boolean
  expanded: boolean
}
export const createNotificationState = (): NotificationState => ({
  items: [],
  nextId: 1,
  paused: false,
  expanded: false,
})

/** Timers are host-owned; IDs, elapsed time and expansion live in the checkpoint. */
export const createNotificationController = (
  view: TabManagerView,
  environment: {
    now: () => number
    schedule?: (callback: () => void, delay: number) => () => void
  },
) => {
  let unsubscribe: (() => void) | undefined
  let cancelTimers: (() => void)[] = []
  let observed: NotificationState | undefined
  let generation = 0
  const synchronize = () => {
    const state = view.getState().notifications
    if (state === observed) return
    observed = state
    generation++
    cancelTimers.forEach((cancel) => cancel())
    cancelTimers = []
    if (state.paused || !environment.schedule) return
    const operation = generation
    for (const entry of state.items) {
      if (entry.remainingMs === null) continue
      const remaining = Math.max(
        0,
        entry.remainingMs -
          (entry.startedAt === null ? 0 : environment.now() - entry.startedAt),
      )
      cancelTimers.push(
        environment.schedule(() => {
          if (
            operation !== generation ||
            view.getState().notifications !== state
          )
            return
          dismiss(entry.id)
        }, remaining),
      )
    }
  }
  const start = () => {
    if (!unsubscribe) unsubscribe = view.subscribe(synchronize)
    synchronize()
  }
  const update = (state: NotificationState) => {
    start()
    view.setState({ notifications: state })
  }
  const dismiss = (id: number) => {
    const state = view.getState().notifications
    const items = state.items.filter((entry) => entry.id !== id)
    update({
      ...state,
      items,
      ...(items.length ? {} : { paused: false, expanded: false }),
    })
  }
  return {
    start,
    publish: (
      message: NotificationMessage,
      durationMs: number | null = 4000,
    ) => {
      const state = view.getState().notifications
      update({
        ...state,
        nextId: state.nextId + 1,
        items: [
          {
            ...message,
            id: state.nextId,
            remainingMs: durationMs,
            startedAt: state.paused ? null : environment.now(),
          },
          ...state.items,
        ],
      })
    },
    dismiss,
    expand: (expanded: boolean) => {
      const state = view.getState().notifications
      if (state.expanded === expanded && state.paused === expanded) return
      const now = environment.now()
      update({
        ...state,
        expanded,
        paused: expanded,
        items: state.items.map((entry) => ({
          ...entry,
          remainingMs:
            entry.remainingMs === null
              ? null
              : Math.max(
                  0,
                  entry.remainingMs -
                    (entry.startedAt === null ? 0 : now - entry.startedAt),
                ),
          startedAt: expanded ? null : now,
        })),
      })
    },
    dispose: () => {
      generation++
      cancelTimers.forEach((cancel) => cancel())
      cancelTimers = []
      unsubscribe?.()
      unsubscribe = undefined
      observed = undefined
    },
  }
}
