import { cn, getGroupColorClasses } from '@extension/ui'
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

export type TabGroupHeaderProps = HTMLAttributes<HTMLDivElement> & {
  group: BrowserTabGroup
  isActive?: boolean
  isRenaming?: boolean
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
            onClick={onToggleCollapse}
            onKeyDown={handleButtonKeyDown}
            className={cn(
              `
                mb-1 flex w-full cursor-pointer items-center gap-2 rounded-md
                px-2 py-1 text-left transition-colors
                hover:bg-background/50
                focus:outline-none
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-transparent
              `,
            )}
          >
            {/* Collapse indicator */}
            <div className="flex h-4 w-4 items-center justify-center">
              {group.collapsed ? (
                <ChevronRight className={cn('size-4', colorClasses.text)} />
              ) : (
                <ChevronDown className={cn('size-4', colorClasses.text)} />
              )}
            </div>

            {/* Color dot */}
            <div className={cn('h-3 w-3 rounded-full', colorClasses.dot)} />

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
