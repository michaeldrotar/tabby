import { useEffect, useId, useState } from 'react'
import { assets } from './content'
import type { RefObject } from 'react'

export const ClosingCat = ({
  visibilityRef,
}: {
  visibilityRef: RefObject<HTMLDivElement | null>
}) => {
  const eyeClip = useId()
  const [winking, setWinking] = useState(false)

  useEffect(() => {
    const element = visibilityRef.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer: number | undefined
    let visible = false
    let played = false
    const cancel = () => window.clearTimeout(timer)
    const waitForStillness = () => {
      cancel()
      if (!visible || played || reducedMotion.matches || document.hidden) return
      timer = window.setTimeout(() => {
        played = true
        setWinking(true)
      }, 2000)
    }
    const onMotionChange = () => {
      if (reducedMotion.matches) setWinking(false)
      waitForStillness()
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry && entry.intersectionRatio === 1
        waitForStillness()
      },
      { threshold: 1 },
    )
    observer.observe(element)
    window.addEventListener('scroll', waitForStillness, { passive: true })
    window.addEventListener('resize', waitForStillness)
    document.addEventListener('visibilitychange', waitForStillness)
    reducedMotion.addEventListener('change', onMotionChange)
    return () => {
      cancel()
      observer.disconnect()
      window.removeEventListener('scroll', waitForStillness)
      window.removeEventListener('resize', waitForStillness)
      document.removeEventListener('visibilitychange', waitForStillness)
      reducedMotion.removeEventListener('change', onMotionChange)
    }
  }, [visibilityRef])

  return (
    <div
      className="closing-cat"
      data-winking={winking}
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setWinking(false)
      }}
    >
      <svg viewBox="0 0 128 128" width="80" height="80">
        <defs>
          <clipPath id={eyeClip}>
            <ellipse cx="38" cy="74" rx="15" ry="14" />
          </clipPath>
        </defs>
        <image href={assets.face} width="128" height="128" />
        <g clipPath={`url(#${eyeClip})`} fill="#fcf3e3">
          <path className="cat-lid cat-lid--upper" d="M22 59h32v16H22z" />
          <path className="cat-lid cat-lid--lower" d="M22 74h32v15H22z" />
        </g>
        <path
          className="cat-closed-eye"
          d="M27 73q11 9 22 0"
          fill="none"
          stroke="#203b59"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <g className="cat-smirk">
          <ellipse cx="55" cy="94" rx="9" ry="7" fill="#fcf3e3" />
          <path
            d="M48 90c1 8 10 11 16 3"
            fill="none"
            stroke="#203b59"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  )
}
