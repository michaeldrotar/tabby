import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from './icons'
import { cn } from './utils/cn'
import * as SelectPrimitive from '@radix-ui/react-select'
import * as React from 'react'

type SelectContextValue = {
  enableClosedArrowKeySelection: boolean
  open: boolean
  value: string | undefined
  onValueChange: ((value: string) => void) | undefined
  itemValues: readonly string[]
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

const getItemValuesFromChildren = (children: React.ReactNode): string[] => {
  const values: string[] = []
  const seen = new Set<string>()

  const visit = (node: React.ReactNode): void => {
    if (node === null || node === undefined || typeof node === 'boolean') return

    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }

    if (!React.isValidElement(node)) return

    const type = node.type as unknown as { displayName?: string }
    const isSelectItem =
      node.type === SelectPrimitive.Item ||
      type?.displayName === SelectPrimitive.Item.displayName

    if (isSelectItem) {
      const value = (node.props as { value?: unknown }).value
      if (typeof value === 'string' && !seen.has(value)) {
        seen.add(value)
        values.push(value)
      }
    }

    const props = node.props as { children?: React.ReactNode }
    if (props?.children !== undefined) visit(props.children)
  }

  visit(children)
  return values
}

type SelectProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Root
> & {
  enableClosedArrowKeySelection?: boolean
}

export const Select = ({
  children,
  enableClosedArrowKeySelection = true,
  open: openProp,
  defaultOpen,
  onOpenChange,
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: SelectProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  )
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)

  const open = openProp ?? uncontrolledOpen
  const value = valueProp ?? uncontrolledValue

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [onOpenChange, openProp],
  )

  const handleValueChange = React.useCallback(
    (nextValue: string) => {
      if (valueProp === undefined) setUncontrolledValue(nextValue)
      onValueChange?.(nextValue)
    },
    [onValueChange, valueProp],
  )

  const itemValues = React.useMemo(
    () => getItemValuesFromChildren(children),
    [children],
  )

  const contextValue = React.useMemo<SelectContextValue>(
    () => ({
      enableClosedArrowKeySelection,
      open,
      value,
      onValueChange: onValueChange ? handleValueChange : undefined,
      itemValues,
    }),
    [
      enableClosedArrowKeySelection,
      handleValueChange,
      itemValues,
      onValueChange,
      open,
      value,
    ],
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <SelectPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  )
}

export const SelectGroup = SelectPrimitive.Group

export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, onKeyDown, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)

  const handleKeyDown: React.KeyboardEventHandler<
    React.ElementRef<typeof SelectPrimitive.Trigger>
  > = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return

    if (!ctx?.enableClosedArrowKeySelection) return
    if (ctx.open) return

    const delta =
      event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (delta === 0) return

    const { itemValues, value, onValueChange: setValue } = ctx
    if (!setValue || itemValues.length === 0) return

    // Radix opens the menu on ArrowUp/ArrowDown by default. When closed-arrow
    // selection is enabled, we always prevent that default behavior.
    event.preventDefault()

    const currentIndex = value ? itemValues.indexOf(value) : -1
    if (currentIndex === -1) {
      const nextIndex = delta === 1 ? 0 : itemValues.length - 1
      const nextValue = itemValues[nextIndex]
      if (!nextValue || nextValue === value) return

      setValue(nextValue)
      return
    }

    const nextIndex = Math.min(
      itemValues.length - 1,
      Math.max(0, currentIndex + delta),
    )

    if (nextIndex === currentIndex) return

    const nextValue = itemValues[nextIndex]
    if (!nextValue || nextValue === value) return

    setValue(nextValue)
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'border-border bg-background ring-offset-background placeholder:text-muted focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <ChevronUpIcon className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

export const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <ChevronDownIcon className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 border-border bg-popover text-popover-foreground relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)] data-[highlighted]:text-foreground relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('bg-border -mx-1 my-1 h-px', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName
