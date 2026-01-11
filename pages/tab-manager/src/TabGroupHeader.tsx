import { cn, getGroupColorClasses } from '@extension/ui'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { BrowserTabGroup } from '@extension/chrome'
import type { HTMLAttributes, ReactNode } from 'react'

export type TabGroupHeaderProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect'
> & {
  group: BrowserTabGroup
  isActive?: boolean
  isRenaming?: boolean
  /** Whether this group is part of selection */
  selected?: boolean
  /** Whether in multi-select mode (affects visual treatment of focus vs selection) */
  isMultiSelectMode?: boolean
  /** Called when the group header is clicked for selection (with modifier keys) */
  onSelect?: (event: React.MouseEvent) => void
  onRenameComplete?: (newTitle: string) => void
  onRenameCancel?: () => void
  onToggleCollapse?: () => void
  onClose?: () => void
  children?: ReactNode
}

export const TabGroupHeader = memo(
  forwardRef<HTMLDivElement, TabGroupHeaderProps>(
    (
      {
        group,
        isActive = false,
        isRenaming = false,
        selected = false,
        isMultiSelectMode = false,
        onSelect,
        onRenameComplete,
        onRenameCancel,
        onToggleCollapse,
        onClose,
        children,
        className,
        ...props
      },
      ref,
    ) => {
      const inputRef = useRef<HTMLInputElement>(null)
      const [renameValue, setRenameValue] = useState('')
      const prefersReducedMotion = useReducedMotion()

      const colorClasses = getGroupColorClasses(group.color)

      const handleClick = useCallback(
        (e: React.MouseEvent) => {
          // If modifier keys are pressed, handle selection
          if (e.metaKey || e.ctrlKey || e.shiftKey) {
            e.preventDefault()
            onSelect?.(e)
          } else if (e.detail === 0) {
            // detail === 0 means this was triggered by Enter key, not a real mouse click
            // Just toggle collapse, don't affect selection
            onToggleCollapse?.()
          } else {
            // Regular mouse click on the main button area: select this group
            onSelect?.(e)
          }
        },
        [onSelect, onToggleCollapse],
      )

      const handleChevronClick = useCallback(
        (e: React.MouseEvent) => {
          // Stop propagation so the parent button's onClick doesn't fire
          e.stopPropagation()
          onToggleCollapse?.()
        },
        [onToggleCollapse],
      )

      const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onRenameComplete?.(renameValue)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onRenameCancel?.()
          }
        },
        [renameValue, onRenameComplete, onRenameCancel],
      )

      const handleBlur = useCallback(() => {
        onRenameComplete?.(renameValue)
      }, [renameValue, onRenameComplete])

      const handleFocus = useCallback(() => {
        setRenameValue(group.title ?? '')
      }, [group.title])

      const handleButtonKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
          if ((e.key === 'Delete' || e.key === 'Backspace') && onClose) {
            e.preventDefault()
            onClose()
          }
        },
        [onClose],
      )

      useEffect(() => {
        if (isRenaming && inputRef.current) {
          requestAnimationFrame(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
          })
        }
      }, [isRenaming])

      return (
        <div
          ref={ref}
          className={cn(
            // Bold redesign: clean container with vertical color accent
            `relative flex flex-col rounded-lg py-1 pl-4 pr-1`,
            // Transition for smooth mode changes
            'transition-all duration-200',
            // Selection styling
            selected &&
              `ring-2 ring-inset ring-accent/[calc(var(--accent-strength)*1%)]`,
            // Focus ring styling via CSS based on mode (on outer container when button is focused)
            isMultiSelectMode
              ? // Multi-select mode: prominent focus ring with offset
                `
                  has-[button:focus-visible]:ring-2
                  has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                  has-[button:focus-visible]:ring-offset-2
                  has-[button:focus-visible]:ring-offset-background
                `
              : // Default mode: subtle fused state when selected
                selected
                ? `
                  has-[button:focus-visible]:ring-1
                  has-[button:focus-visible]:ring-inset
                  has-[button:focus-visible]:ring-foreground/20
                `
                : // Not selected: show standard focus ring
                  `
                    has-[button:focus-visible]:ring-2
                    has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
                    has-[button:focus-visible]:ring-offset-2
                    has-[button:focus-visible]:ring-offset-background
                  `,
            // Removed full background - cleaner, more elegant
            className,
          )}
          data-nav-type="group"
          data-group-id={group.id}
          data-selected={selected}
          {...props}
        >
          {/* Bold Vertical Color Line - The signature group indicator */}
          <div
            className={cn(
              'absolute bottom-2 left-1 top-2 w-1 rounded-full',
              colorClasses.dot, // Use the dot color for the vertical line
            )}
            aria-hidden="true"
          />

          {isActive && (
            <div
              className={cn(
                'absolute bottom-2 left-0 top-2 w-0.5 rounded-full',
                'bg-accent/[calc(var(--accent-strength)*1%)]',
              )}
            />
          )}
          {/* Header row */}
          <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleButtonKeyDown}
            className={cn(
              `
                mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md
                px-2 py-1 text-left transition-colors
                hover:bg-highlighted/30
                focus:outline-none
                focus-visible:outline-none
              `,
            )}
          >
            {/* Collapse indicator - animated rotation */}
            <div
              role="button"
              tabIndex={-1}
              onClick={handleChevronClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleCollapse?.()
                }
              }}
              className={`
                flex h-5 w-5 items-center justify-center rounded
                transition-colors
                hover:bg-background/80
              `}
              aria-label={group.collapsed ? 'Expand group' : 'Collapse group'}
            >
              {prefersReducedMotion ? (
                // Static icons for reduced motion preference
                group.collapsed ? (
                  <ChevronRight
                    className={cn('size-4', colorClasses.text)}
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className={cn('size-4', colorClasses.text)}
                    aria-hidden="true"
                  />
                )
              ) : (
                // Animated rotation for chevron
                <motion.div
                  animate={{ rotate: group.collapsed ? -90 : 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <ChevronDown
                    className={cn('size-4', colorClasses.text)}
                    aria-hidden="true"
                  />
                </motion.div>
              )}
            </div>

            {/* Title - Bold, prominent */}
            {isRenaming ? (
              <input
                ref={inputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  `
                    flex-1 rounded border border-border bg-background px-1.5
                    py-0.5 text-xs font-bold uppercase tracking-wider
                    outline-none
                    focus:border-accent focus:ring-1 focus:ring-accent
                  `,
                  colorClasses.text,
                )}
              />
            ) : (
              <h4
                className={cn(
                  'text-xs font-bold uppercase tracking-wider opacity-80',
                  colorClasses.text,
                )}
              >
                {group.title || 'Untitled Group'}
              </h4>
            )}
          </button>

          {/* Children (tabs) with animated collapse */}
          <AnimatePresence initial={false}>
            {!group.collapsed && children && (
              <motion.div
                initial={
                  prefersReducedMotion ? false : { height: 0, opacity: 0 }
                }
                animate={{ height: 'auto', opacity: 1 }}
                exit={
                  prefersReducedMotion ? undefined : { height: 0, opacity: 0 }
                }
                transition={{
                  height: { type: 'spring', stiffness: 400, damping: 30 },
                  opacity: { duration: 0.15 },
                }}
                className="overflow-hidden"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    },
  ),
)
