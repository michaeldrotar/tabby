import { useSurface } from '@extension/ui/Surface'
import { useEffect, useState } from 'react'
import type { TabbyEnvironment } from './TabbyProvider'

/** One host-scheduled clock per experience; captured surfaces never advance it. */
export const useExperienceClock = (
  environment: Pick<TabbyEnvironment, 'now' | 'schedule'>,
) => {
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const [, refresh] = useState(0)
  const { now, schedule } = environment
  useEffect(() => {
    if (!live || !schedule) return
    let active = true
    let cancel: (() => void) | undefined
    const tick = () => {
      if (!active) return
      refresh(now())
      cancel = schedule(tick, 1000)
    }
    cancel = schedule(tick, 1000)
    return () => {
      active = false
      cancel?.()
    }
  }, [live, now, schedule])
  return now()
}
