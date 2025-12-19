import { cn } from './utils/cn'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import * as React from 'react'

export const ContextMenu = ContextMenuPrimitive.Root

export const ContextMenuTrigger = ContextMenuPrimitive.Trigger

export const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        `
          animate-in fade-in-80 z-50 min-w-[8rem] overflow-hidden rounded-md
          border border-border bg-popover p-1 text-popover-foreground shadow-md
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=open]:zoom-in-95
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          data-[state=closed]:zoom-out-95
          data-[side=bottom]:slide-in-from-top-2
          data-[side=left]:slide-in-from-right-2
          data-[side=right]:slide-in-from-left-2
          data-[side=top]:slide-in-from-bottom-2
        `,
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

export const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      `
        cursor-default', 'select-none relative flex items-center rounded-sm px-2
        py-1.5 text-sm outline-none
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)]
        data-[highlighted]:text-foreground
      `,
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName
