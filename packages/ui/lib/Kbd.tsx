import { cn } from './utils/cn'

export type KbdProps = React.ComponentPropsWithoutRef<'kbd'>

export const Kbd = ({ className, ...props }: KbdProps) => {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 whitespace-nowrap rounded-sm border',
        'border-border bg-input px-1 font-mono text-xs font-medium leading-none text-muted',
        "[&_svg:not([class*='size-'])]:size-3",
        '[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10',
        className,
      )}
      {...props}
    />
  )
}

export type KbdGroupProps = React.ComponentPropsWithoutRef<'span'>

export const KbdGroup = ({ className, ...props }: KbdGroupProps) => {
  return (
    <span
      data-slot="kbd-group"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  )
}
