import { useEffect, useEffectEvent, useId, useRef } from 'react'
import { CatFace } from './CatFace'
import { assets } from './content'
import type { RefObject } from 'react'

type ScrollReaction = {
  onScroll: (delta: number) => void
  onFrame: (element: HTMLElement, elapsed: number, quiet: boolean) => boolean
  onReset: (element: HTMLElement) => void
}

const useScrollReaction = (
  ref: RefObject<HTMLElement | null>,
  reaction: ScrollReaction,
) => {
  const react = useEffectEvent(reaction.onScroll)
  const animate = useEffectEvent(reaction.onFrame)
  const reset = useEffectEvent(reaction.onReset)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lastY = scrollY
    let lastInput = performance.now()
    let lastFrame = lastInput
    let frame = 0
    const inView = () => {
      const bounds = element.getBoundingClientRect()
      return bounds.bottom >= -90 && bounds.top <= innerHeight + 90
    }
    let visible = inView()
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      lastY = scrollY
      reset(element)
    }
    const tick = (now: number) => {
      const moving = animate(
        element,
        Math.min(32, Math.max(1, now - lastFrame)),
        now - lastInput > 120,
      )
      lastFrame = now
      frame = moving ? requestAnimationFrame(tick) : 0
    }
    const onScroll = () => {
      const delta = scrollY - lastY
      lastY = scrollY
      const wasVisible = visible
      visible = inView()
      if (motion.matches || document.hidden || !visible || !wasVisible) {
        stop()
        return
      }
      if (!delta) return
      lastInput = performance.now()
      react(delta)
      if (!frame) {
        lastFrame = lastInput
        frame = requestAnimationFrame(tick)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', stop)
    motion.addEventListener('change', stop)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', stop)
      motion.removeEventListener('change', stop)
    }
  }, [ref])
}

const stillCat = () => ({
  lift: 0,
  liftSpeed: 0,
  targetLift: 0,
  squash: 0,
  squashSpeed: 0,
  targetSquash: 0,
})

export const BannerCat = () => {
  const ref = useRef<HTMLSpanElement>(null)
  const pose = useRef(stillCat())
  const paint = (element: HTMLElement) => {
    element.dataset.surprised = String(pose.current.lift > 0)
    element.style.setProperty('--cat-lift', `${pose.current.lift}px`)
    element.style.setProperty('--cat-squash', String(pose.current.squash))
    element.style.setProperty(
      '--cat-wide',
      String(Math.min(1, pose.current.lift / 12)),
    )
  }
  useScrollReaction(ref, {
    onScroll: (delta) => {
      const state = pose.current
      if (delta > 0)
        state.squash = Math.max(state.squash, Math.min(0.4, delta * 0.008))
      else state.liftSpeed += Math.min(8, Math.abs(delta) * 0.1)
      state.targetLift =
        delta < 0 ? Math.min(72, state.targetLift + Math.abs(delta) * 0.9) : 0
      state.targetSquash =
        delta > 0 ? Math.min(0.5, state.targetSquash + delta * 0.012) : 0
    },
    onFrame: (element, elapsed, quiet) => {
      const state = pose.current
      const step = elapsed / 16.67
      if (quiet) {
        state.targetLift = 0
        state.targetSquash = 0
      }
      state.liftSpeed =
        (state.liftSpeed + (state.targetLift - state.lift) * 0.11 * step) *
        Math.pow(0.78, step)
      state.lift += state.liftSpeed * step
      if (state.lift < 0) {
        state.squashSpeed += Math.min(0.2, Math.abs(state.liftSpeed) * 0.018)
        state.lift = 0
        state.liftSpeed = 0
      }
      state.squashSpeed =
        (state.squashSpeed + (state.targetSquash - state.squash) * 0.2 * step) *
        Math.pow(0.68, step)
      state.squash = Math.max(
        -0.18,
        Math.min(0.6, state.squash + state.squashSpeed * step),
      )
      const settled =
        quiet &&
        state.lift < 0.1 &&
        Math.abs(state.liftSpeed) < 0.1 &&
        Math.abs(state.squash) < 0.002 &&
        Math.abs(state.squashSpeed) < 0.002
      if (settled) pose.current = stillCat()
      paint(element)
      return !settled
    },
    onReset: (element) => {
      pose.current = stillCat()
      paint(element)
    },
  })
  return (
    <span ref={ref} className="banner-cat" aria-hidden="true">
      <span className="banner-cat-shadow" />
      <CatFace size={48}>
        <g className="banner-cat-surprise">
          {[39, 89].map((x) => (
            <g key={x}>
              <ellipse
                cx={x}
                cy="75"
                rx="18"
                ry="24"
                fill="#fff5e4"
                stroke="#031a39"
                strokeWidth="2"
              />
              <circle
                className="banner-cat-pupil"
                cx={x}
                cy="78"
                r="6"
                fill="#031a39"
              />
              <circle cx={x + 2} cy="75" r="2" fill="white" />
            </g>
          ))}
        </g>
      </CatFace>
    </span>
  )
}

type Gait = {
  offsets: number[]
  lifts: number[]
  active: number | null
  next: number
  progress: number
}
const restingPaws = (): Gait => ({
  offsets: [0, 0],
  lifts: [0, 0],
  active: null,
  next: 0,
  progress: 0,
})
const easeStep = (progress: number) => progress * progress * (3 - 2 * progress)

export const WalkingPaws = () => {
  const ref = useRef<HTMLDivElement>(null)
  const clipId = useId()
  const gait = useRef(restingPaws())
  const travel = useRef({ minimum: 0, maximum: 0 })
  const bounded = (offset: number) =>
    Math.max(travel.current.minimum, Math.min(travel.current.maximum, offset))
  const paint = (element: HTMLElement) => {
    const scale = 1024 / element.clientWidth
    element
      .querySelectorAll<SVGGElement>('.walking-paw')
      .forEach((paw, index) => {
        paw.style.setProperty(
          '--paw-y',
          `${bounded(gait.current.offsets[index]! - gait.current.lifts[index]!) * scale}px`,
        )
        paw.dataset.stepping = String(gait.current.lifts[index]! > 0.1)
      })
  }
  useScrollReaction(ref, {
    onScroll: (delta) => {
      const element = ref.current
      if (!element) return
      const bounds = element.getBoundingClientRect()
      const section = element.parentElement!.getBoundingClientRect()
      travel.current = {
        minimum: section.top + 1 - bounds.top,
        maximum: section.bottom - 1 - bounds.bottom,
      }
      gait.current.offsets = gait.current.offsets.map((offset) =>
        bounded(offset + delta),
      )
      paint(element)
    },
    onFrame: (element, elapsed, quiet) => {
      const state = gait.current
      if (state.active === null) {
        if (quiet && state.offsets.every((offset) => Math.abs(offset) < 0.25)) {
          gait.current = restingPaws()
          paint(element)
          return false
        }
        state.active =
          quiet && Math.abs(state.offsets[state.next]!) < 0.25
            ? 1 - state.next
            : state.next
        state.progress = 0
      }
      const active = state.active
      const nextProgress = Math.min(1, state.progress + elapsed / 260)
      state.offsets[active]! *=
        (1 - easeStep(nextProgress)) /
        Math.max(0.0001, 1 - easeStep(state.progress))
      state.lifts[active] = Math.sin(Math.PI * nextProgress) * 20
      state.progress = nextProgress
      if (nextProgress === 1) {
        state.offsets[active] = 0
        state.lifts[active] = 0
        state.active = null
        state.next = 1 - active
      }
      paint(element)
      return true
    },
    onReset: (element) => {
      gait.current = restingPaws()
      paint(element)
    },
  })
  return (
    <div ref={ref} className="walking-paws" aria-hidden="true">
      <svg viewBox="0 0 1024 1024" width="100" height="100">
        <defs>
          <clipPath id={`${clipId}-left`}>
            <path d="M0 0h369l338 1024H0Z" />
          </clipPath>
          <clipPath id={`${clipId}-right`}>
            <path d="M369 0h655v1024H707Z" />
          </clipPath>
        </defs>
        {['left', 'right'].map((side) => (
          <g
            key={side}
            className={`
              walking-paw
              walking-paw--${side}
            `}
          >
            <image
              href={assets.paws}
              width="1024"
              height="1024"
              clipPath={`url(#${clipId}-${side})`}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
