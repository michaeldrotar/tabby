import { useDragDropContext, makeItemKey } from './hooks/DragDropContext'
import { cn } from '@extension/ui'
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
import type { DragEvent, HTMLAttributes, ReactNode } from 'react'

const GROUP_COLORS: Record<string, { dot: string; text: string; bg: string }> =
  {
    grey: {
      dot: 'bg-gray-600 dark:bg-gray-300',
      text: 'text-gray-800 dark:text-gray-200',
      bg: 'bg-gray-500/10',
    },
    blue: {
      dot: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    red: {
      dot: 'bg-red-500',
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-500/10',
    },
    yellow: {
      dot: 'bg-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    green: {
      dot: 'bg-green-500',
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-500/10',
    },
    pink: {
      dot: 'bg-pink-500',
      text: 'text-pink-700 dark:text-pink-400',
      bg: 'bg-pink-500/10',
    },
    purple: {
      dot: 'bg-purple-500',
      text: 'text-purple-700 dark:text-purple-400',
      bg: 'bg-purple-500/10',
    },
    cyan: {
      dot: 'bg-cyan-500',
      text: 'text-cyan-700 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    orange: {
      dot: 'bg-orange-500',
      text: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
  }

export type TabGroupHeaderProps = HTMLAttributes<HTMLDivElement> & {
  group: BrowserTabGroup
  prevItemKey: string | null
  /** Group ID if the previous item is inside a group */
  prevInsideGroupId?: number
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
        prevItemKey,
        prevInsideGroupId,
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

      const {
        draggedItem,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
      } = useDragDropContext()

      const itemKey = makeItemKey('group', group.id)
      const isDragging =
        draggedItem?.type === 'group' && draggedItem?.id === group.id

      const onDragStart = useCallback(
        (e: DragEvent) => {
          handleDragStart(e, { type: 'group', id: group.id })
        },
        [handleDragStart, group.id],
      )

      const onDragOver = useCallback(
        (e: DragEvent) => {
          // Groups don't have insideGroupId since groups can't be nested
          // prevInsideGroupId tells us if the item before is in a group
          handleDragOver(e, itemKey, prevItemKey, undefined, prevInsideGroupId)
        },
        [handleDragOver, itemKey, prevItemKey, prevInsideGroupId],
      )

      const colorClasses =
        group.color && GROUP_COLORS[group.color]
          ? GROUP_COLORS[group.color]
          : {
              dot: 'bg-muted/70',
              text: 'text-muted',
              bg: 'bg-muted/10',
            }

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
          draggable
          onDragStart={onDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={onDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            `relative flex flex-col rounded-lg p-1 transition-colors`,
            colorClasses.bg,
            isDragging && 'opacity-50',
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
