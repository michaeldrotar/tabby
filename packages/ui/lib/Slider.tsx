import * as SliderPrimitive from '@radix-ui/react-slider'
import * as React from 'react'
import { cn } from './utils/cn'

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={`
          bg-input relative h-2 w-full grow overflow-hidden rounded-full
        `}
      >
        <SliderPrimitive.Range className="bg-accent absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        className={`
          border-accent bg-card ring-offset-background block h-5 w-5
          rounded-full border-2 transition-colors
          focus-visible:ring-focus focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:pointer-events-none disabled:opacity-50
        `}
      />
    </SliderPrimitive.Root>
  )
})

Slider.displayName = SliderPrimitive.Root.displayName
