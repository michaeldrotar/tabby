import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { motion } from 'framer-motion'
import { cn } from './utils/cn'
import type { ComponentProps } from 'react'

const MotionViewport = motion.create(ScrollAreaPrimitive.Viewport)

type ScrollBarProps = ComponentProps<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
> & {}

const ScrollBar = ({
  className,
  orientation = 'vertical',
  ...props
}: ScrollBarProps) => {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      className={cn(
        `
          flex touch-none p-px opacity-50 transition-opacity select-none
          hover:opacity-100
        `,
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        className={`relative flex-1 rounded-full bg-muted/60`}
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export type ScrollAreaProps = ComponentProps<
  typeof ScrollAreaPrimitive.Root
> & {
  orientation?: 'vertical' | 'horizontal' | 'both'
}

export const ScrollArea = ({
  className,
  children,
  orientation = 'both',
  ...props
}: ScrollAreaProps) => {
  return (
    <ScrollAreaPrimitive.Root
      className={cn('relative overflow-hidden', className)}
      type="scroll"
      {...props}
    >
      <MotionViewport
        layoutScroll
        className={cn(
          'size-full overscroll-none rounded-[inherit]',
          orientation === 'vertical' && '[&>div]:block!',
        )}
      >
        {children}
      </MotionViewport>
      {(orientation === 'vertical' || orientation === 'both') && (
        <ScrollBar orientation="vertical" />
      )}
      {(orientation === 'horizontal' || orientation === 'both') && (
        <ScrollBar orientation="horizontal" />
      )}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
