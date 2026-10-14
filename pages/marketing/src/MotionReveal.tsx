import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

export const useScrollEntrance = (
  ref: RefObject<HTMLDivElement | null>,
  threshold = 0.38,
) => {
  const [entered, setEntered] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= threshold) {
          setEntered(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold])

  return entered
}

export const MotionReveal = ({
  className,
  children,
  threshold,
}: {
  className: string
  children: ReactNode
  threshold?: number
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const entered = useScrollEntrance(ref, threshold)
  return (
    <div ref={ref} className={className} data-entered={entered}>
      {children}
    </div>
  )
}
