import { motion } from 'framer-motion'
import { memo, useRef } from 'react'
import { useShouldReduceMotion } from './useShouldReduceMotion'
import type { SVGAttributes } from 'react'

export type RadialLoadingSpinnerProps = Omit<
  SVGAttributes<SVGSVGElement>,
  'viewBox' | 'fill' | 'children'
> & {
  /** Size of the spinner in pixels */
  size?: number
  /** Color variant using theme colors */
  variant?: 'accent' | 'foreground' | 'muted'
}

/**
 * RadialLoadingSpinner - A radial loading spinner with size-based styling.
 *
 * Features:
 * - Variable stroke thickness (thicker at top, thinner at bottom)
 * - Smooth animations with prefers-reduced-motion support
 * - Uses theme colors that respect accent-strength
 *
 * @example
 * ```tsx
 * <RadialLoadingSpinner
 *   size={20}
 *   variant="accent"
 * />
 * ```
 */
export const RadialLoadingSpinner = memo<RadialLoadingSpinnerProps>(
  ({ size = 20, variant = 'foreground', ...props }) => {
    const svgRef = useRef<SVGSVGElement>(null)
    const shouldReduceMotion = useShouldReduceMotion(svgRef) ?? false

    // Constants
    const duration = 1.5
    const strokeWidth = size * 0.11 // 11% of size
    const minStroke = strokeWidth * 0.4
    const initialRotation = -110 // Start at top
    const directionMultiplier = 1 // clockwise

    // Calculated values
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius

    // Arc length varies from 25% to 10% of circumference
    const maxArcLength = circumference * 0.25
    const minArcLength = circumference * 0.1

    const strokeClass =
      variant === 'accent'
        ? 'stroke-accent/[calc(var(--accent-strength)*1%)]'
        : variant === 'muted'
          ? 'stroke-muted'
          : 'stroke-foreground'

    return (
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-label="Loading"
        aria-busy="true"
        {...props}
      >
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeLinecap="round"
          className={strokeClass}
          initial={{
            rotate: initialRotation,
            strokeDasharray: `${maxArcLength} ${circumference}`,
            strokeWidth: strokeWidth,
          }}
          animate={
            shouldReduceMotion
              ? {
                  // Reduced motion: just a simple steady spin, no thickness/arc changes
                  rotate: [
                    initialRotation,
                    directionMultiplier * 360 + initialRotation,
                  ],
                  strokeDasharray: `${maxArcLength} ${circumference}`,
                  strokeWidth: strokeWidth,
                }
              : {
                  rotate: [
                    initialRotation,
                    directionMultiplier * 360 + initialRotation,
                  ],
                  strokeDasharray: [
                    `${maxArcLength} ${circumference}`,
                    `${minArcLength} ${circumference}`,
                    `${maxArcLength} ${circumference}`,
                  ],
                  strokeWidth: [strokeWidth, minStroke, strokeWidth],
                }
          }
          transition={
            shouldReduceMotion
              ? {
                  rotate: {
                    duration,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                }
              : {
                  rotate: {
                    duration,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  strokeDasharray: {
                    duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  strokeWidth: {
                    duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
          }
          style={{
            transformOrigin: '50% 50%',
          }}
        />
      </svg>
    )
  },
)

RadialLoadingSpinner.displayName = 'RadialLoadingSpinner'
