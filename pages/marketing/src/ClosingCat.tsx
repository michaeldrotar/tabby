import { useEffect, useId, useState } from 'react'
import { assets } from './content'
import { useIdleCue } from './useIdleCue'
import type { CSSProperties, RefObject } from 'react'

const winkDuration = 1440

export const ClosingCat = ({
  visibilityRef,
}: {
  visibilityRef: RefObject<HTMLDivElement | null>
}) => {
  const eyeClip = useId()
  const [wink, setWink] = useState<'idle' | 'clicked' | null>(null)
  const [clicked, setClicked] = useState(false)
  const winking = wink !== null

  useEffect(() => {
    if (!winking) return
    const timer = window.setTimeout(() => setWink(null), winkDuration)
    return () => window.clearTimeout(timer)
  }, [winking])

  useIdleCue(visibilityRef, {
    delay: 2000,
    threshold: 1,
    enabled: !clicked,
    onCue: () => setWink('idle'),
    onCancel: () => setWink((current) => (current === 'idle' ? null : current)),
  })

  return (
    <button
      type="button"
      className="closing-cat"
      style={{ '--wink-duration': `${winkDuration}ms` } as CSSProperties}
      data-winking={winking}
      aria-label="Make Tabby wink"
      onClick={() => {
        setClicked(true)
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
          setWink('clicked')
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setWink(null)
      }}
    >
      <svg viewBox="0 0 128 128" width="80" height="80" aria-hidden="true">
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
    </button>
  )
}
