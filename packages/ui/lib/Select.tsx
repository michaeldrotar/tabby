import * as React from 'react'
import { createPortal } from 'react-dom'
import { CheckIcon, ChevronDownIcon } from './icons'
import { useSurface, useSurfaceId, useSurfaceInputOwner } from './Surface'
import { cn } from './utils/cn'

type Item = {
  value: string
  label: React.ReactNode
  text: string
  disabled?: boolean
}
type SelectContextValue = {
  open: boolean
  value?: string
  disabled?: boolean
  items: Item[]
  highlighted?: string
  highlight: (value: string) => void
  setOpen: (open: boolean) => void
  change: (value: string) => void
  trigger: React.RefObject<HTMLButtonElement | null>
  setTrigger: (element: HTMLButtonElement | null) => void
  id: string
  enableClosedArrowKeySelection: boolean
}
const SelectContext = React.createContext<SelectContextValue | null>(null)
const useSelect = () => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('Select components require a Select parent.')
  return context
}
const textContent = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textContent).join('')
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return textContent(node.props.children)
  return ''
}
const collectItems = (node: React.ReactNode): Item[] => {
  const items: Item[] = []
  React.Children.forEach(node, (child) => {
    if (
      !React.isValidElement<{
        value?: string
        children?: React.ReactNode
        disabled?: boolean
      }>(child)
    )
      return
    if (child.type === SelectItem && child.props.value !== undefined)
      items.push({
        value: child.props.value,
        label: child.props.children,
        text: textContent(child.props.children),
        disabled: child.props.disabled,
      })
    else items.push(...collectItems(child.props.children))
  })
  return items
}
export type SelectProps = {
  children: React.ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  enableClosedArrowKeySelection?: boolean
  disabled?: boolean
  name?: string
}
export const Select = ({
  children,
  value: valueProp,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  enableClosedArrowKeySelection = true,
  disabled,
  name,
}: SelectProps) => {
  const [localValue, setLocalValue] = React.useState(defaultValue)
  const [localOpen, setLocalOpen] = React.useState(defaultOpen)
  const [highlighted, highlight] = React.useState<string>()
  const trigger = React.useRef<HTMLButtonElement>(null)
  const id = useSurfaceId('select')
  const items = React.useMemo(() => collectItems(children), [children])
  const value = valueProp ?? localValue
  const open = openProp ?? localOpen
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setLocalOpen(next)
    if (next) highlight(value ?? items.find((item) => !item.disabled)?.value)
    onOpenChange?.(next)
  }
  const change = (next: string) => {
    if (valueProp === undefined) setLocalValue(next)
    onValueChange?.(next)
  }
  return (
    <SelectContext.Provider
      value={{
        value,
        open,
        disabled,
        items,
        highlighted,
        highlight,
        setOpen,
        change,
        trigger,
        setTrigger: (element) => {
          trigger.current = element
        },
        id,
        enableClosedArrowKeySelection,
      }}
    >
      {children}
      {name && <input type="hidden" name={name} value={value ?? ''} />}
    </SelectContext.Provider>
  )
}
export const SelectValue = ({
  placeholder,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  placeholder?: React.ReactNode
}) => {
  const context = useSelect()
  return (
    <span {...props}>
      {children ??
        context.items.find((item) => item.value === context.value)?.label ??
        placeholder}
    </span>
  )
}
export const SelectGroup = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="group" {...props}>
    {children}
  </div>
)

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onKeyDown, onClick, ...props }, ref) => {
  const context = useSelect()
  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
    event,
  ) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || context.disabled) return
    if (
      ['Enter', ' '].includes(event.key) ||
      (!context.enableClosedArrowKeySelection &&
        ['ArrowDown', 'ArrowUp'].includes(event.key))
    ) {
      event.preventDefault()
      context.setOpen(true)
      return
    }
    const delta =
      event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (!delta || context.open || !context.enableClosedArrowKeySelection) return
    event.preventDefault()
    const items = context.items.filter((item) => !item.disabled)
    const index = items.findIndex((item) => item.value === context.value)
    const item =
      items[
        index < 0
          ? delta === 1
            ? 0
            : items.length - 1
          : Math.min(items.length - 1, Math.max(0, index + delta))
      ]
    if (item && item.value !== context.value) context.change(item.value)
  }
  return (
    <button
      ref={(element) => {
        context.setTrigger(element)
        if (typeof ref === 'function') ref(element)
        else if (ref) ref.current = element
      }}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-controls={context.id}
      aria-expanded={context.open}
      disabled={context.disabled}
      data-state={context.open ? 'open' : 'closed'}
      className={cn(
        `
          border-border bg-background ring-offset-background flex h-10 w-full
          items-center justify-between rounded-md border px-3 py-2 text-sm
          placeholder:text-muted
          focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-offset-2
          focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-50
          [&>span]:line-clamp-1
        `,
        className,
      )}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) context.setOpen(!context.open)
      }}
      {...props}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    position?: 'popper' | 'item-aligned'
  }
>(({ className, children, position: _position, ...props }, ref) => {
  const context = useSelect()
  const surface = useSurface()
  const { canFocusInput } = useSurfaceInputOwner()
  const content = React.useRef<HTMLDivElement>(null)
  const typeahead = React.useRef({ text: '', lastKeyTime: 0 })
  const [placement, setPlacement] = React.useState<React.CSSProperties>({})
  const live = !surface || surface.inputMode === 'live'
  const { open, trigger, id } = context
  React.useEffect(() => {
    typeahead.current = { text: '', lastKeyTime: 0 }
  }, [open])
  React.useLayoutEffect(() => {
    if (!open || !trigger.current) return
    const update = () => {
      const box = trigger.current!.getBoundingClientRect()
      const bounds = surface?.root?.getBoundingClientRect()
      const room = (bounds?.bottom ?? window.innerHeight) - box.bottom - 8
      const height = Math.min(384, content.current?.scrollHeight ?? 240)
      const above = room < Math.min(height, 120)
      setPlacement({
        position: bounds ? 'absolute' : 'fixed',
        left: box.left - (bounds?.left ?? 0),
        width: box.width,
        top: above ? undefined : box.bottom - (bounds?.top ?? 0) + 4,
        bottom: above
          ? (bounds?.bottom ?? window.innerHeight) - box.top + 4
          : undefined,
        maxHeight: Math.max(
          80,
          above ? box.top - (bounds?.top ?? 0) - 8 : room,
        ),
      })
    }
    update()
    const root = surface?.root ?? document
    root.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    if (canFocusInput()) content.current?.focus({ preventScroll: true })
    return () => {
      root.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, trigger, surface?.root, canFocusInput])
  React.useLayoutEffect(() => {
    if (!open || !content.current) return
    const highlighted = live
      ? (context.highlighted ?? context.value)
      : context.value
    const highlightedId = `${id}-${highlighted}`
    const option = Array.from(
      content.current.querySelectorAll<HTMLElement>('[role="option"]'),
    ).find((item) => item.id === highlightedId)
    if (!option) return
    const viewport = content.current.getBoundingClientRect()
    const item = option.getBoundingClientRect()
    if (item.top < viewport.top)
      content.current.scrollTop -= viewport.top - item.top
    else if (item.bottom > viewport.bottom)
      content.current.scrollTop += item.bottom - viewport.bottom
  }, [open, context.highlighted, context.value, id, placement.maxHeight, live])
  React.useEffect(() => {
    if (!open || !live) return
    const root = surface?.root ?? document
    const closeOutside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !content.current?.contains(event.target) &&
        !trigger.current?.contains(event.target)
      )
        context.setOpen(false)
    }
    root.addEventListener('pointerdown', closeOutside)
    root.addEventListener('focusin', closeOutside)
    return () => {
      root.removeEventListener('pointerdown', closeOutside)
      root.removeEventListener('focusin', closeOutside)
    }
  }, [context, open, live, surface?.root, trigger])
  const close = () => {
    context.setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!live || event.nativeEvent.isComposing) return
    if (event.timeStamp - typeahead.current.lastKeyTime > 1000)
      typeahead.current.text = ''
    const items = context.items.filter((item) => !item.disabled)
    const index = items.findIndex(
      (item) => item.value === (context.highlighted ?? context.value),
    )
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : Math.min(
                items.length - 1,
                Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)),
              )
      const item = items[next]
      if (item) context.highlight(item.value)
    } else if (
      event.key === 'Enter' ||
      (event.key === ' ' && !typeahead.current.text)
    ) {
      event.preventDefault()
      const item = items.find(
        (item) => item.value === (context.highlighted ?? context.value),
      )
      if (item) context.change(item.value)
      close()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') {
      context.setOpen(false)
      trigger.current?.focus({ preventScroll: true })
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault()
      typeahead.current.text += event.key.toLowerCase()
      typeahead.current.lastKeyTime = event.timeStamp
      const typed = typeahead.current.text
      const search = Array.from(typed).every((letter) => letter === typed[0])
        ? typed[0]!
        : typed
      const start = Math.max(0, index + (search.length === 1 ? 1 : 0))
      const ordered = [...items.slice(start), ...items.slice(0, start)]
      const item = ordered.find((item) =>
        item.text.trim().toLowerCase().startsWith(search),
      )
      if (item) context.highlight(item.value)
    }
  }
  if (!open || (surface && !surface.portalHost)) return null
  const popup = (
    <div
      ref={(element) => {
        content.current = element
        if (typeof ref === 'function') ref(element)
        else if (ref) ref.current = element
      }}
      id={id}
      role="listbox"
      tabIndex={-1}
      aria-activedescendant={`${id}-${context.highlighted ?? context.value}`}
      data-state="open"
      data-side={placement.bottom === undefined ? 'bottom' : 'top'}
      className={cn(
        `
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=open]:zoom-in-95
          data-[side=bottom]:slide-in-from-top-2
          data-[side=top]:slide-in-from-bottom-2
          motion-reduce:animate-none
        `,
        `
          border-border bg-popover text-popover-foreground z-50 max-h-96
          min-w-[8rem] overflow-auto rounded-md border p-1 shadow-md
          outline-none
        `,
        className,
      )}
      style={placement}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  )
  return createPortal(popup, surface?.portalHost ?? document.body)
})
SelectContent.displayName = 'SelectContent'
export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }
>(
  (
    {
      className,
      children,
      value,
      disabled,
      onClick,
      onKeyDown,
      onPointerMove,
      ...props
    },
    ref,
  ) => {
    const context = useSelect()
    const surface = useSurface()
    const live = !surface || surface.inputMode === 'live'
    const highlighted =
      (live ? (context.highlighted ?? context.value) : context.value) === value
    const select = () => {
      if (!live || disabled) return
      context.change(value)
      context.setOpen(false)
      context.trigger.current?.focus({ preventScroll: true })
    }
    return (
      <div
        ref={ref}
        id={`${context.id}-${value}`}
        role="option"
        tabIndex={-1}
        aria-selected={context.value === value}
        aria-disabled={disabled}
        data-highlighted={highlighted ? '' : undefined}
        data-disabled={disabled ? '' : undefined}
        className={cn(
          `
            data-[highlighted]:bg-accent/[calc(var(--accent-strength)*1%)]
            data-[highlighted]:text-foreground
            relative flex w-full cursor-default select-none items-center
            rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none
            data-[disabled]:pointer-events-none data-[disabled]:opacity-50
          `,
          className,
        )}
        onPointerMove={(event) => {
          onPointerMove?.(event)
          if (live && !disabled) context.highlight(value)
        }}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) select()
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || !live || disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            select()
          }
        }}
        {...props}
      >
        <span
          className={`
            absolute left-2 flex h-3.5 w-3.5 items-center justify-center
          `}
        >
          {context.value === value && <CheckIcon className="h-4 w-4" />}
        </span>
        {children}
      </div>
    )
  },
)
SelectItem.displayName = 'SelectItem'
export const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
))
SelectLabel.displayName = 'SelectLabel'
export const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn('bg-border -mx-1 my-1 h-px', className)}
    {...props}
  />
))
SelectSeparator.displayName = 'SelectSeparator'
