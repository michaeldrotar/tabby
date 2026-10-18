import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import releases from './releases.json'

const phoneQuery = '(max-width: 760px)'
const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches
const versionIndex = () => {
  try {
    return Math.max(
      0,
      releases.findIndex(
        (release) =>
          release.version === decodeURIComponent(location.hash.slice(1)),
      ),
    )
  } catch {
    return 0
  }
}

export const useReleaseReader = () => {
  const [enabled, setEnabled] = useState(() => matchMedia(phoneQuery).matches)
  const [index, setIndex] = useState(versionIndex)
  const selected = useRef(index)
  const ref = useRef<HTMLDivElement>(null)
  const pending = useRef<{ direction: number; focus: boolean } | null>(null)

  useEffect(() => {
    const phone = matchMedia(phoneQuery)
    const update = () => setEnabled(phone.matches)
    phone.addEventListener('change', update)
    return () => phone.removeEventListener('change', update)
  }, [])

  const show = useCallback((next: number, push = true) => {
    const reader = ref.current
    if (
      !reader ||
      next < 0 ||
      next >= releases.length ||
      next === selected.current
    )
      return
    pending.current = {
      direction: next > selected.current ? 1 : -1,
      focus: reader.contains(document.activeElement),
    }
    reader.style.minHeight = `${reader.getBoundingClientRect().height}px`
    selected.current = next
    setIndex(next)
    const hash = `#${releases[next]!.version}`
    if (push && location.hash !== hash) history.pushState(null, '', hash)
  }, [])

  const focusCurrent = useCallback(() => {
    const reader = ref.current
    if (!reader) return
    reader.scrollIntoView({ behavior: 'instant', block: 'start' })
    reader
      .querySelector<HTMLElement>('article:not([hidden])')
      ?.focus({ preventScroll: true })
  }, [])

  useLayoutEffect(() => {
    if (!enabled) return
    const reader = ref.current!
    const transition = pending.current
    if (!transition) return
    pending.current = null
    const top = parseFloat(getComputedStyle(reader).scrollMarginTop)
    const bounds = reader.getBoundingClientRect()
    const scrollTop = scrollY + bounds.top - top
    reader.style.minHeight = ''
    reader.getAnimations().forEach((animation) => animation.cancel())
    if (
      transition.focus &&
      !(document.activeElement instanceof HTMLButtonElement)
    )
      reader.focus({ preventScroll: true })
    let alignment: number | undefined
    if (bounds.top <= top + 1) {
      // Replace native scroll momentum for a painted frame before aligning.
      window.scrollTo({ top: scrollY, behavior: 'smooth' })
      alignment = requestAnimationFrame(() => {
        alignment = requestAnimationFrame(() =>
          window.scrollTo({ top: Math.max(0, scrollTop), behavior: 'instant' }),
        )
      })
    }
    if (!reducedMotion())
      reader.animate(
        [
          {
            opacity: 0.4,
            transform: `translateX(${transition.direction * 36}px)`,
          },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' },
      )
    return () => {
      if (alignment !== undefined) cancelAnimationFrame(alignment)
    }
  }, [enabled, index])

  useLayoutEffect(() => {
    if (!enabled) return
    const reader = ref.current!
    let start: { x: number; y: number; pointer: number } | null = null
    let wheelDistance = 0
    let wheelTime = 0
    let wheelHandled = false
    let wheelHandledAt = 0
    let wheelTail = Infinity
    let wheelDirection = 0
    const reset = () => {
      start = null
      reader.style.transform = ''
    }
    const down = (event: PointerEvent) => {
      if (
        event.pointerType === 'mouse' ||
        (event.target instanceof Element &&
          event.target.closest('a, button, nav'))
      )
        return
      reader.getAnimations().forEach((animation) => animation.cancel())
      start = { x: event.clientX, y: event.clientY, pointer: event.pointerId }
    }
    const move = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.pointer) return
      const x = event.clientX - start.x
      const y = event.clientY - start.y
      if (Math.abs(y) > Math.abs(x) && Math.abs(y) > 12) return reset()
      if (Math.abs(x) > 12 && Math.abs(x) > Math.abs(y) * 1.4) {
        reader.setPointerCapture(event.pointerId)
        if (!reducedMotion())
          reader.style.transform = `translateX(${Math.max(-48, Math.min(48, x * 0.25))}px)`
      }
    }
    const up = (event: PointerEvent) => {
      if (!start || event.pointerId !== start.pointer) return
      const x = event.clientX - start.x
      const y = event.clientY - start.y
      reset()
      if (Math.abs(x) >= 60 && Math.abs(x) > Math.abs(y) * 1.4)
        show(selected.current + (x < 0 ? 1 : -1))
    }
    const wheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.4 ||
        (event.target instanceof Element && event.target.closest('nav, button'))
      )
        return
      event.preventDefault()
      const now = performance.now()
      const scale =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerWidth : 1
      const delta = event.deltaX * scale
      const magnitude = Math.abs(delta)
      const direction = Math.sign(delta)
      const renewed =
        wheelHandled &&
        now - wheelHandledAt >= 260 &&
        (direction !== wheelDirection ||
          (magnitude >= wheelTail + 8 && magnitude >= wheelTail * 2))
      if (now - wheelTime > 180 || renewed) {
        wheelDistance = 0
        wheelHandled = false
      }
      wheelTime = now
      if (wheelHandled) {
        wheelTail = Math.min(wheelTail, magnitude)
        return
      }
      if (direction !== wheelDirection) wheelDistance = 0
      wheelDirection = direction
      wheelDistance += delta
      if (Math.abs(wheelDistance) < 60) return
      wheelHandled = true
      wheelHandledAt = now
      wheelTail = magnitude
      show(selected.current + (wheelDistance > 0 ? 1 : -1))
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('a, button, input, select, textarea')
      )
        return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        show(selected.current + (event.key === 'ArrowLeft' ? -1 : 1))
      }
    }
    const sync = () => show(versionIndex(), false)
    sync()
    if (location.hash)
      reader.scrollIntoView({ behavior: 'instant', block: 'start' })
    reader.addEventListener('pointerdown', down)
    reader.addEventListener('pointermove', move)
    reader.addEventListener('pointerup', up)
    reader.addEventListener('pointercancel', reset)
    reader.addEventListener('keydown', onKeyDown)
    reader.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      reset()
      pending.current = null
      reader.style.minHeight = ''
      reader.getAnimations().forEach((animation) => animation.cancel())
      reader.removeEventListener('pointerdown', down)
      reader.removeEventListener('pointermove', move)
      reader.removeEventListener('pointerup', up)
      reader.removeEventListener('pointercancel', reset)
      reader.removeEventListener('keydown', onKeyDown)
      reader.removeEventListener('wheel', wheel)
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [enabled, show])

  return { enabled, index, select: show, ref, focusCurrent }
}
