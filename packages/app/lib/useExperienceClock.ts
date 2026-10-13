import { useSurface } from '@extension/ui/Surface'
import { useEffect, useState } from 'react'
import type { TabbyEnvironment } from './TabbyProvider'

const identity = (time: number): unknown => time

/** One host-scheduled clock per experience; captured surfaces never advance it. */
export const useExperienceClock = (
  environment: Pick<TabbyEnvironment, 'now' | 'schedule'>,
  select: (time: number) => unknown = identity,
) => {
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const [, refresh] = useState(0)
  const { now, schedule } = environment
  useEffect(() => {
    if (!live || !schedule) return
    let active = true
    let previous = select(now())
    let cancel: (() => void) | undefined
    const tick = () => {
      if (!active) return
      const time = now()
      const next = select(time)
      if (!Object.is(previous, next)) {
        previous = next
        refresh(time)
      }
      cancel = schedule(tick, 1000)
    }
    cancel = schedule(tick, 1000)
    return () => {
      active = false
      cancel?.()
    }
  }, [live, now, schedule, select])
  return now()
}
