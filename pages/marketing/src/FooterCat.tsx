import { useEffect, useRef } from 'react'
import { assets } from './content'

export const FooterCat = () => {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const cat = ref.current
    if (!cat) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const mouse = matchMedia('(any-hover: hover) and (any-pointer: fine)')
    let timer: number | undefined
    let animation: Animation | undefined
    let point = { x: 0, y: 0 }
    const showCursor = () => {
      delete document.documentElement.dataset.tabbyCursorEaten
    }
    const reset = () => {
      window.clearTimeout(timer)
      animation?.cancel()
      animation = undefined
      delete cat.dataset.phase
      showCursor()
      delete document.documentElement.dataset.tabbyCursorMouse
    }
    const isNearby = () => {
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
      animation.onfinish = () => {
        animation?.cancel()
        animation = undefined
        delete cat.dataset.phase
        if (!document.documentElement.dataset.tabbyCursorEaten) scheduleHunt()
      }
    }
    const hunt = () => {
      const bounds = cat.getBoundingClientRect()
      if (
        motion.matches ||
        !mouse.matches ||
        document.hidden ||
        bounds.top < 0 ||
        bounds.bottom > innerHeight
      )
        return
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
        document.documentElement.dataset.tabbyCursorEaten = 'true'
        timer = window.setTimeout(goHome, 360)
      }
    }
    const scheduleHunt = () => {
      if (isNearby()) timer = window.setTimeout(hunt, 900)
    }
    const onMove = (event: PointerEvent) => {
      if (event.clientX === point.x && event.clientY === point.y) return
      point = { x: event.clientX, y: event.clientY }
      showCursor()
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
      if (cat.dataset.phase) {
        if (cat.dataset.phase !== 'returning') goHome()
        return
      }
      scheduleHunt()
    }
    const onLeave = (event: PointerEvent) => {
      if (!event.relatedTarget) reset()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerout', onLeave)
    const interruptions = ['pointerdown', 'keydown', 'scroll', 'resize', 'blur']
    for (const event of interruptions)
      window.addEventListener(event, reset, { passive: true })
    document.addEventListener('visibilitychange', reset)
    motion.addEventListener('change', reset)
    mouse.addEventListener('change', reset)
    return () => {
      reset()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerout', onLeave)
      for (const event of interruptions)
        window.removeEventListener(event, reset)
      document.removeEventListener('visibilitychange', reset)
      motion.removeEventListener('change', reset)
      mouse.removeEventListener('change', reset)
    }
  }, [])

  return (
    <span className="footer-cat-home" aria-hidden="true">
      <span ref={ref} className="footer-cat">
        <svg viewBox="0 0 128 128" width="45" height="45">
          <image href={assets.face} width="128" height="128" />
          <g className="footer-cat-expression">
            <path d="M46 90h36v12H46z" fill="#fcf3e3" />
            <g className="footer-cat-mouth">
              <ellipse cx="64" cy="102" rx="21" ry="22" fill="#203b59" />
              <path d="m49 86 5 11 5-14m10 0 5 14 5-11" fill="white" />
              <ellipse cx="64" cy="114" rx="12" ry="7" fill="#f28b8b" />
            </g>
          </g>
        </svg>
      </span>
    </span>
  )
}
