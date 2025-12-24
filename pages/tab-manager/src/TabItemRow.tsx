import { useDragDropContext, makeItemKey } from './hooks/DragDropContext'
import { cn, Favicon } from '@extension/ui'
import { Volume2, VolumeOff, Pin } from 'lucide-react'
import { forwardRef, memo, useCallback } from 'react'
import type { BrowserTab } from '@extension/chrome'
import type { DragEvent, HTMLAttributes } from 'react'

export type TabItemRowProps = HTMLAttributes<HTMLDivElement> & {
  tab: BrowserTab
  prevItemKey: string | null
  /** Group ID if the previous item is inside a group */
  prevInsideGroupId?: number
  onActivate: () => void
  onClose?: () => void
}

/**
 * A row component for displaying a single tab in the tab list.
 * Uses item keys for position tracking in drag-and-drop.
 */
export const TabItemRow = memo(
  forwardRef<HTMLDivElement, TabItemRowProps>(
    (
      {
        tab,
        prevItemKey,
        prevInsideGroupId,
        onActivate,
        onClose,
        className,
        ...props
      },
      ref,
    ) => {
      const isPinned = tab.pinned
      const isMuted = tab.mutedInfo?.muted ?? false
      const isAudible = tab.audible ?? false
      const isDiscarded = tab.discarded ?? false
      const isActive = tab.active
      const isHighlighted = tab.highlighted

      const {
        draggedItem,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
      } = useDragDropContext()

      const itemKey = makeItemKey('tab', tab.id)
      const isDragging =
        draggedItem?.type === 'tab' && draggedItem?.id === tab.id

      // Determine if this tab is inside a group
      const insideGroupId =
        tab.groupId !== undefined && tab.groupId !== -1
          ? tab.groupId
          : undefined

      const onDragStart = useCallback(
        (e: DragEvent) => {
          e.stopPropagation()
          handleDragStart(e, { type: 'tab', id: tab.id, groupId: tab.groupId })
        },
        [handleDragStart, tab.id, tab.groupId],
      )

      const onDragOver = useCallback(
        (e: DragEvent) => {
          handleDragOver(
            e,
            itemKey,
            prevItemKey,
            insideGroupId,
            prevInsideGroupId,
          )
        },
        [
          handleDragOver,
          itemKey,
          prevItemKey,
          insideGroupId,
          prevInsideGroupId,
        ],
      )

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && onClose) {
          e.preventDefault()
          onClose()
        }
      }

      return (
        <div
          ref={ref}
          data-tab-item={tab.id}
          data-nav-type="tab"
          data-active={isActive}
          draggable
          onDragStart={onDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={onDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            `
              group relative overflow-hidden rounded-md
              has-[button:focus-visible]:ring-2
              has-[button:focus-visible]:ring-accent/[calc(var(--accent-strength)*1%)]
              has-[button:focus-visible]:ring-offset-2
              has-[button:focus-visible]:ring-offset-background
            `,
            isDragging && 'opacity-50',
            className,
          )}
          {...props}
        >
          <button
            type="button"
            className={cn(
              `
                flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left
                text-sm transition-colors
                focus:outline-none
                focus-visible:outline-none
              `,
              isActive
                ? 'bg-accent/[calc(var(--accent-strength)*1%)] text-foreground'
                : isHighlighted
                  ? `
                    bg-accent/[calc(var(--accent-strength)*1%)] text-foreground
                  `
                  : `
                    text-foreground
                    group-hover:bg-highlighted/50
                  `,
            )}
            onClick={onActivate}
            onKeyDown={handleKeyDown}
          >
            {/* Favicon */}
            <div
              className={cn(
                `
                  relative flex h-5 w-5 flex-shrink-0 items-center
                  justify-center
                `,
                isDiscarded && 'opacity-50',
              )}
            >
              <Favicon
                pageUrl={tab.url ?? ''}
                size={20}
                className={cn('transition-transform', 'group-hover:scale-110')}
              />
              {isDiscarded && (
                <div
                  className={`
                    absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border
                    border-background bg-muted
                  `}
                />
              )}
            </div>

            {/* Title */}
            <span
              className={cn(
                'flex-1 truncate',
                isActive && 'font-medium',
                isDiscarded && 'opacity-70',
              )}
            >
              {tab.title || 'Untitled'}
            </span>

            {/* Status indicators */}
            <div className="flex items-center gap-1">
              {isPinned && <Pin className="size-3 text-muted opacity-60" />}
              {isAudible && !isMuted && (
                <Volume2 className="size-3 animate-pulse text-accent" />
              )}
              {isMuted && (
                <VolumeOff className="size-3 text-muted opacity-60" />
              )}
            </div>
          </button>
        </div>
      )
    },
  ),
)
