import { cn } from './utils/cn'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import type { ComponentProps } from 'react'

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
        'flex touch-none select-none p-px opacity-50',
        'transition-opacity hover:opacity-100',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb className="bg-muted-foreground/60 relative flex-1 rounded-full" />
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
      <ScrollAreaPrimitive.Viewport
        className={cn(
          'size-full overscroll-none rounded-[inherit]',
          orientation === 'vertical' && '[&>div]:!block',
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
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
