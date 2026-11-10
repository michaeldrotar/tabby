import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { forwardRef } from 'react'
import { useSurface } from '../Surface'
import { cn } from '../utils/cn'
import type * as React from 'react'

export const ContextMenu = ContextMenuPrimitive.Root

export const ContextMenuTrigger = ContextMenuPrimitive.Trigger

export const ContextMenuGroup = ContextMenuPrimitive.Group

export const ContextMenuPortal = ContextMenuPrimitive.Portal

export const ContextMenuSub = ContextMenuPrimitive.Sub

export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

export const ContextMenuContent = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => {
  const surface = useSurface()
  if (surface && !surface.portalHost) return null
  return (
    <ContextMenuPrimitive.Portal container={surface?.portalHost ?? undefined}>
      <ContextMenuPrimitive.Content
        ref={ref}
        collisionPadding={16}
        className={cn(
          `
            animate-in fade-in-0 zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
            data-[state=closed]:zoom-out-95
            data-[side=bottom]:slide-in-from-top-2
            data-[side=left]:slide-in-from-right-2
            data-[side=right]:slide-in-from-left-2
            data-[side=top]:slide-in-from-bottom-2
            z-50
            max-h-[min(var(--radix-context-menu-content-available-height),480px)]
            min-w-48 overflow-x-hidden overflow-y-auto rounded-lg border
            border-border bg-popover p-1 text-popover-foreground shadow-lg
            shadow-black/10 outline-hidden
            dark:shadow-black/20
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-muted/60
            [&::-webkit-scrollbar-track]:bg-transparent
          `,
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
})
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

export const ContextMenuSubTrigger = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      `
        flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm
        outline-hidden select-none
        data-disabled:pointer-events-none data-disabled:opacity-50
        data-highlighted:bg-accent-selected
        data-[state=open]:bg-accent-hover
      `,
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto size-4 opacity-60" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

export const ContextMenuSubContent = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    collisionPadding={16}
    className={cn(
      `
        animate-in fade-in-0 slide-in-from-left-1
        data-[state=closed]:animate-out data-[state=closed]:fade-out-0
        data-[state=closed]:slide-out-to-left-1
        z-50
        max-h-[min(var(--radix-context-menu-content-available-height),320px)]
        min-w-40 overflow-x-hidden overflow-y-auto rounded-lg border
        border-border bg-popover p-1 text-popover-foreground shadow-lg
        shadow-black/10 outline-hidden
        dark:shadow-black/20
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-muted/60
        [&::-webkit-scrollbar-track]:bg-transparent
      `,
      className,
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

export const ContextMenuItem = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
    variant?: 'default' | 'destructive'
  }
>(({ className, inset, variant, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      `
        relative flex cursor-default items-center gap-2 rounded-md px-2.5 py-2
        text-sm outline-hidden transition-colors select-none
        data-disabled:pointer-events-none data-disabled:opacity-50
        data-highlighted:bg-accent-selected
        [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
        [&_svg]:opacity-60
      `,
      variant === 'destructive' &&
        `
          text-red-600
          data-highlighted:bg-red-500/10 data-highlighted:text-red-600
          dark:text-red-400
          dark:data-highlighted:text-red-400
        `,
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

export const ContextMenuCheckboxItem = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      `
        relative flex cursor-default items-center gap-2 rounded-md py-2 pr-2.5
        pl-8 text-sm outline-hidden transition-colors select-none
        data-disabled:pointer-events-none data-disabled:opacity-50
        data-highlighted:bg-accent-selected
      `,
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex size-4 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="size-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

export const ContextMenuRadioItem = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      `
        relative flex cursor-default items-center gap-2 rounded-md py-2 pr-2.5
        pl-8 text-sm outline-hidden transition-colors select-none
        data-disabled:pointer-events-none data-disabled:opacity-50
        data-highlighted:bg-accent-selected
      `,
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex size-4 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="size-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

export const ContextMenuLabel = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2.5 py-1.5 text-xs font-semibold text-muted',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

export const ContextMenuSeparator = forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

export const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-muted opacity-60',
        className,
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = 'ContextMenuShortcut'
