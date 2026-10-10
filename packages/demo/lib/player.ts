export type TimelineFrame<State> = {
  at: number
  title: string
  state: State
}

export type TimelineScheduler = {
  now: () => number
  schedule: (callback: () => void, delay: number) => () => void
}

export type PlaybackState = {
  time: number
  duration: number
  step: number
  title: string
  playing: boolean
}

/** Playback restores checkpoints; it never forwards physical input to the product. */
export const createDemoPlayer = <State>(
  frames: readonly TimelineFrame<State>[],
  restore: (state: State, time: number) => void,
  scheduler: TimelineScheduler,
  clone: (state: State) => State,
) => {
  if (
    !frames.length ||
    frames[0]?.at !== 0 ||
    frames.some(
      (frame, index) => index > 0 && frame.at <= frames[index - 1]!.at,
    )
  ) {
    throw new Error(
      'A timeline must start at zero and have increasing step times.',
    )
  }
  const duration = frames.at(-1)!.at
  const listeners = new Set<() => void>()
  let cancelTick: (() => void) | undefined
  let generation = 0
  let origin = 0
  let snapshot: PlaybackState = {
    time: 0,
    duration,
    step: 0,
    title: frames[0]!.title,
    playing: false,
  }
  const publish = (time: number, playing: boolean, force = false) => {
    const step = frames.findLastIndex((frame) => frame.at <= time)
    const frame = frames[step]!
    if (force || step !== snapshot.step) restore(clone(frame.state), time)
    snapshot = { time, duration, step, title: frame.title, playing }
    listeners.forEach((listener) => listener())
  }
  const stopTick = () => {
    generation++
    cancelTick?.()
    cancelTick = undefined
  }
  const tick = (operation: number) => {
    if (operation !== generation) return
    const time = Math.min(duration, Math.max(0, scheduler.now() - origin))
    publish(time, time < duration)
    if (time < duration)
      cancelTick = scheduler.schedule(() => tick(operation), 40)
  }
  const seek = (time: number) => {
    const playing = snapshot.playing
    stopTick()
    const position = Math.max(0, Math.min(duration, time))
    publish(position, playing && position < duration, true)
    if (snapshot.playing) {
      origin = scheduler.now() - position
      const operation = generation
      cancelTick = scheduler.schedule(() => tick(operation), 40)
    }
  }
  restore(clone(frames[0]!.state), 0)
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    play: () => {
      stopTick()
      if (snapshot.time === duration) seek(0)
      origin = scheduler.now() - snapshot.time
      publish(snapshot.time, true)
      const operation = generation
      cancelTick = scheduler.schedule(() => tick(operation), 40)
    },
    pause: () => {
      stopTick()
      publish(snapshot.time, false)
    },
    seek,
    rewind: () => seek(0),
    previous: () => seek(frames[Math.max(0, snapshot.step - 1)]!.at),
    next: () =>
      seek(frames[Math.min(frames.length - 1, snapshot.step + 1)]!.at),
    dispose: () => {
      stopTick()
      listeners.clear()
    },
  }
}
