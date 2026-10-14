import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export const ScaledIllustration = ({
  width,
  height,
  label,
  className,
  stageClassName,
  children,
}: {
  width: number
  height: number
  label: string
  className: string
  stageClassName?: string
  children: ReactNode
}) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const frame = frameRef.current!
    const resize = () => setScale(frame.getBoundingClientRect().width / width)
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [width])
  return (
    <div
      ref={frameRef}
      className={className}
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label={label}
    >
      <div
        className={`
          illustration-stage
          ${stageClassName ?? ''}
        `}
        style={{ width, height, transform: `scale(${scale})` }}
        inert
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  )
}
