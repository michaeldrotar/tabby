import { cn } from '../utils/cn'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { forwardRef } from 'react'
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
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      collisionPadding={16}
      className={cn(
        `
          animate-in fade-in-0 zoom-in-95 z-50
          max-h-[min(var(--radix-context-menu-content-available-height),480px)]
          min-w-[12rem] overflow-y-auto overflow-x-hidden rounded-lg border
          border-border bg-popover p-1 text-popover-foreground shadow-lg
          shadow-black/10 outline-none
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=closed]:zoom-out-95
          data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2
          dark:shadow-black/20
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-muted/60
          [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2
        `,
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
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
        flex cursor-default select-none items-center gap-2 rounded-md px-2.5
        py-2 text-sm outline-none
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)]
        data-[state=open]:bg-accent/[calc(var(--accent-strength)*0.5%)]
      `,
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
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
        animate-in fade-in-0 slide-in-from-left-1 z-50
        max-h-[min(var(--radix-context-menu-content-available-height),320px)]
        min-w-[10rem] overflow-y-auto overflow-x-hidden rounded-lg border
        border-border bg-popover p-1 text-popover-foreground shadow-lg
        shadow-black/10 outline-none
        data-[state=closed]:animate-out data-[state=closed]:fade-out-0
        data-[state=closed]:slide-out-to-left-1
        dark:shadow-black/20
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-muted/60
        [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2
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
        relative flex cursor-default select-none items-center gap-2 rounded-md
        px-2.5 py-2 text-sm outline-none transition-colors
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)]
        [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
        [&_svg]:opacity-60
      `,
      variant === 'destructive' &&
        `
          text-red-600
          data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-600
          dark:text-red-400 dark:data-[highlighted]:text-red-400
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
        relative flex cursor-default select-none items-center gap-2 rounded-md
        py-2 pl-8 pr-2.5 text-sm outline-none transition-colors
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)]
      `,
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
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
        relative flex cursor-default select-none items-center gap-2 rounded-md
        py-2 pl-8 pr-2.5 text-sm outline-none transition-colors
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)]
      `,
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
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
      'px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted',
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
