import { cn } from './utils/cn'

export type KbdProps = React.ComponentPropsWithoutRef<'kbd'>

export const Kbd = ({ className, ...props }: KbdProps) => {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        `
          pointer-events-none inline-flex h-5 w-fit min-w-5 items-center
          justify-center gap-1 rounded-xs border border-border bg-input px-1
          font-mono text-xs leading-none font-medium whitespace-nowrap
          text-muted select-none
          in-data-[slot=tooltip-content]:bg-background/20
          in-data-[slot=tooltip-content]:text-background
          dark:in-data-[slot=tooltip-content]:bg-background/10
          [&_svg:not([class*='size-'])]:size-3
        `,
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
