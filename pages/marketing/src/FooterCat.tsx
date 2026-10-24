import { useEffect, useRef } from 'react'
import { CatFace } from './CatFace'

type Point = { x: number; y: number }

export const FooterCat = () => {
  const ref = useRef<HTMLButtonElement>(null)
  const baitRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const cat = ref.current
    const bait = baitRef.current
    if (!cat || !bait) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)')
    let timer: number | undefined
    let animation: Animation | undefined
    let point: Point | null = null
    let cursorPoint: Point | null = null
    const stop = () => {
      window.clearTimeout(timer)
      animation?.cancel()
      animation = undefined
      delete cat.dataset.phase
      delete document.documentElement.dataset.tabbyCursorMouse
      bait.hidden = true
      point = null
    }
    const reset = () => {
      stop()
      delete document.documentElement.dataset.tabbyCursorHidden
    }
    const isNearby = () => {
      if (!point) return false
      const bounds = cat.parentElement!.getBoundingClientRect()
      return (
        bounds.top >= 0 &&
        bounds.bottom <= innerHeight &&
        Math.hypot(
          point.x - (bounds.left + bounds.width / 2),
          point.y - (bounds.top + bounds.height / 2),
        ) <= 180
      )
    }
    const goHome = () => {
      window.clearTimeout(timer)
      const transform = getComputedStyle(cat).transform
      animation?.cancel()
      cat.dataset.phase = 'returning'
      animation = cat.animate([{ transform }, { transform: 'none' }], {
        duration: 550,
        easing: 'cubic-bezier(.22, 1, .36, 1)',
        fill: 'forwards',
      })
      animation.onfinish = stop
    }
    const hunt = () => {
      const bounds = cat.getBoundingClientRect()
      if (
        !point ||
        cat.dataset.phase ||
        motion.matches ||
        document.hidden ||
        bounds.top < 0 ||
        bounds.bottom > innerHeight
      )
        return
      window.clearTimeout(timer)
      delete document.documentElement.dataset.tabbyCursorMouse
      document.documentElement.dataset.tabbyCursorHidden = 'true'
      bait.style.left = `${point.x - 3}px`
      bait.style.top = `${point.y - 5}px`
      bait.hidden = false
      const x = point.x - (bounds.left + bounds.width / 2)
      const y = point.y - (bounds.top + bounds.height * 0.8)
      const tilt = Math.max(-25, Math.min(25, x * 0.15))
      cat.dataset.phase = 'hunting'
      animation = cat.animate(
        [
          { transform: 'none', offset: 0 },
          {
            transform: `translate(${-x * 0.08}px, 5px) scale(1.08, .85)`,
            offset: 0.22,
          },
          {
            transform: `translate(${x * 0.5}px, ${y * 0.5 - 38}px) rotate(${tilt}deg) scale(1.65)`,
            offset: 0.65,
          },
          { transform: `translate(${x}px, ${y}px) scale(1.8)`, offset: 1 },
        ],
        { duration: 700, easing: 'ease-in-out', fill: 'forwards' },
      )
      animation.onfinish = () => {
        cat.dataset.phase = 'eating'
        bait.hidden = true
        timer = window.setTimeout(goHome, 360)
      }
    }
    const scheduleHunt = () => {
      if (isNearby()) timer = window.setTimeout(hunt, 900)
    }
    const onMove = (event: PointerEvent) => {
      if (event.clientX === cursorPoint?.x && event.clientY === cursorPoint?.y)
        return
      cursorPoint = { x: event.clientX, y: event.clientY }
      delete document.documentElement.dataset.tabbyCursorHidden
      if (cat.dataset.phase) return
      point = cursorPoint
      window.clearTimeout(timer)
      if (event.pointerType !== 'mouse' || event.buttons || !mouse.matches) {
        reset()
        return
      }
      document.documentElement.toggleAttribute(
        'data-tabby-cursor-mouse',
        isNearby(),
      )
      if (motion.matches) return
      scheduleHunt()
    }
    const onClick = (event: MouseEvent) => {
      if (
        cat.dataset.phase ||
        event.button ||
        event.defaultPrevented ||
        motion.matches
      )
        return
      const target = event.target
      if (!(target instanceof Element)) return
      const onCat = cat.contains(target)
      if (
        !onCat &&
        target.closest('a, button, input, select, textarea, [contenteditable]')
      )
        return
      const bounds = cat.parentElement!.getBoundingClientRect()
      point =
        onCat && event.detail === 0
          ? {
              x: Math.min(innerWidth - 32, bounds.right + 70),
              y: Math.max(40, bounds.top - 60),
            }
          : { x: event.clientX, y: event.clientY }
      if (!isNearby()) return
      hunt()
    }
    const onInput = () => {
      if (!cat.dataset.phase) reset()
    }
    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !event.relatedTarget) onInput()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onLeave)
    window.addEventListener('click', onClick)
    window.addEventListener('pointerdown', onInput, { passive: true })
    window.addEventListener('keydown', onInput)
    const interruptions = ['scroll', 'resize', 'blur']
    for (const event of interruptions)
      window.addEventListener(event, reset, { passive: true })
    document.addEventListener('visibilitychange', reset)
    motion.addEventListener('change', reset)
    mouse.addEventListener('change', reset)
    return () => {
      reset()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
      window.removeEventListener('click', onClick)
      window.removeEventListener('pointerdown', onInput)
      window.removeEventListener('keydown', onInput)
      for (const event of interruptions)
        window.removeEventListener(event, reset)
      document.removeEventListener('visibilitychange', reset)
      motion.removeEventListener('change', reset)
      mouse.removeEventListener('change', reset)
    }
  }, [])

  return (
    <span className="footer-cat-home">
      <span
        ref={baitRef}
        className="footer-cat-bait"
        aria-hidden="true"
        hidden
      />
      <button
        ref={ref}
        className="footer-cat"
        type="button"
        aria-label="Play with Tabby"
      >
        <CatFace size={45}>
          <g className="footer-cat-expression">
            <path d="M46 90h36v12H46z" fill="#fcf3e3" />
            <g className="footer-cat-mouth">
              <ellipse cx="64" cy="102" rx="21" ry="22" fill="#203b59" />
              <path d="m49 86 5 11 5-14m10 0 5 14 5-11" fill="white" />
              <ellipse cx="64" cy="114" rx="12" ry="7" fill="#f28b8b" />
            </g>
          </g>
        </CatFace>
      </button>
    </span>
  )
}
