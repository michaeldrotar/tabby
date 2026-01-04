import { getGroupColorClasses } from '@extension/ui/tab-group/tabGroupColors'
import { cn } from '@extension/ui/utils/cn'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { BrowserTabGroup } from '@extension/chrome/tabGroup/BrowserTabGroup'
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
  /** Whether keyboard focus is on this item (for multi-select mode) */
  isFocused?: boolean
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
        isFocused = false,
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
            `relative flex flex-col rounded-lg p-1 transition-colors`,
            // Selection background overlay
            selected
              ? `
                ring-2 ring-inset ring-accent/[calc(var(--accent-strength)*1%)]
              `
              : '',
            // Focus ring for multi-select mode
            isFocused
              ? `
                ring-2 ring-accent/[calc(var(--accent-strength)*1%)]
                ring-offset-2 ring-offset-background
              `
              : '',
            colorClasses.bg,
            className,
          )}
          data-nav-type="group"
          data-group-id={group.id}
          {...props}
        >
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
                hover:bg-background/50
                focus:outline-none
              `,
              // Only show focus-visible ring when not using isFocused prop
              !isFocused &&
                `
                  focus-visible:ring-2
                  focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-transparent
                `,
            )}
          >
            {/* Collapse indicator - separate click target for toggle only */}
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
                flex h-4 w-4 items-center justify-center rounded
                hover:bg-background/80
              `}
              aria-label={group.collapsed ? 'Expand group' : 'Collapse group'}
            >
              {group.collapsed ? (
                <ChevronRight
                  className={cn('size-4', colorClasses.text)}
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className={cn('size-4', colorClasses.text)}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Color dot */}
            <div
              className={cn('h-3 w-3 rounded-full', colorClasses.dot)}
              aria-hidden="true"
            />

            {/* Title */}
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

          {/* Children (tabs) */}
          {children}
        </div>
      )
    },
  ),
)
