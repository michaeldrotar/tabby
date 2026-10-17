import { motion } from 'framer-motion'
import { useShouldReduceMotion } from '../useShouldReduceMotion'
import type { ReactNode } from 'react'

export const DragReveal = ({
  active,
  children,
}: {
  active?: boolean
  children: ReactNode
}) => {
  const reduced = useShouldReduceMotion()
  return (
    <motion.span
      data-drag-reveal={active || undefined}
      className="inline-flex shrink-0"
      animate={{ x: active && !reduced ? [0, -2, 2, -2, 2, 0] : 0 }}
      transition={{ duration: reduced ? 0 : 0.36 }}
    >
      {children}
    </motion.span>
  )
}
