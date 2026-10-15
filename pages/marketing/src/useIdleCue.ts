import { useCallback, useEffect, useEffectEvent, useRef } from 'react'
import type { RefObject } from 'react'

const cueGroups = new Map<string, number>()

const reserveCue = (group: string | undefined, duration: number) => {
  const now = performance.now()
  const wait = Math.max(0, (group ? (cueGroups.get(group) ?? 0) : 0) - now)
  if (group && !wait) cueGroups.set(group, now + duration + 300)
  return wait
}

export const useIdleCue = (
  ref: RefObject<HTMLElement | null>,
  {
    delay,
    interval,
    threshold = 0.6,
    enabled = true,
    group,
    duration = 1000,
    pauseOnFocus = true,
    onCue,
    onCancel,
  }: {
    delay: number
    interval?: number | (() => number)
    threshold?: number
    enabled?: boolean
    group?: string
    duration?: number
    pauseOnFocus?: boolean
    onCue: () => void
    onCancel?: () => void
  },
) => {
  const cue = useEffectEvent(onCue)
  const cancelCue = useEffectEvent(() => onCancel?.())
  const request = useRef<((wait: number) => void) | null>(null)
  const requestCue = useCallback((wait = 0) => request.current?.(wait), [])

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof IntersectionObserver === 'undefined')
      return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: number | undefined
    let manualTimer: number | undefined
    let finishTimer: number | undefined
    let manual = false
    let visible = false
    let played = false
    const cancel = () => window.clearTimeout(timer)
    const schedule = (wait = delay) => {
      cancel()
      if (!visible || motion.matches || document.hidden) {
        cancelCue()
        return
      }
      if (
        manual ||
        (!interval && played) ||
        (pauseOnFocus && element.contains(document.activeElement))
      )
        return
      timer = window.setTimeout(() => {
        const wait = reserveCue(group, duration)
        if (wait) {
          schedule(wait)
          return
        }
        played = true
        cue()
        if (interval)
          schedule(typeof interval === 'function' ? interval() : interval)
      }, wait)
    }
    request.current = (wait) => {
      cancel()
      window.clearTimeout(manualTimer)
      window.clearTimeout(finishTimer)
      cancelCue()
      manual = true
      const play = () => {
        if (!visible || motion.matches || document.hidden) {
          manual = false
          schedule()
          return
        }
        const wait = reserveCue(group, duration)
        if (wait) {
          manualTimer = window.setTimeout(play, wait)
          return
        }
        cue()
        finishTimer = window.setTimeout(() => {
          manual = false
          cancelCue()
          schedule(
            typeof interval === 'function' ? interval() : (interval ?? delay),
          )
        }, duration)
      }
      manualTimer = window.setTimeout(play, wait)
    }
    const onActivity = () => {
      if (manual && !motion.matches && !document.hidden) return
      window.clearTimeout(manualTimer)
      window.clearTimeout(finishTimer)
      manual = false
      cancelCue()
      schedule()
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry && entry.intersectionRatio >= threshold
        onActivity()
      },
      { threshold },
    )
    observer.observe(element)
    window.addEventListener('scroll', onActivity, { passive: true })
    window.addEventListener('resize', onActivity)
    document.addEventListener('visibilitychange', onActivity)
    motion.addEventListener('change', onActivity)
    const activities = [
      'pointermove',
      'pointerdown',
      'keydown',
      'focusin',
      'focusout',
    ]
    for (const event of activities) element.addEventListener(event, onActivity)
    return () => {
      cancel()
      window.clearTimeout(manualTimer)
      window.clearTimeout(finishTimer)
      request.current = null
      observer.disconnect()
      window.removeEventListener('scroll', onActivity)
      window.removeEventListener('resize', onActivity)
      document.removeEventListener('visibilitychange', onActivity)
      motion.removeEventListener('change', onActivity)
      for (const event of activities)
        element.removeEventListener(event, onActivity)
    }
  }, [ref, delay, interval, threshold, enabled, group, duration, pauseOnFocus])
  return requestCue
}
