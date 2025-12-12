import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ContextMenu'
import { CloseIcon } from './icons'
import { cn } from './utils/cn'
import { memo } from 'react'
import type { DataAttributes } from './DataAttributes'

export type TabItemProps = {
  label: string
  iconUrl: string
  isActive: boolean
  isDiscarded: boolean
  isHighlighted: boolean
  onActivate: () => void
  onRemove: () => void
} & DataAttributes

export const TabItem = memo(
  ({
    label,
    iconUrl,
    isActive,
    isDiscarded,
    isHighlighted,
    onActivate,
    onRemove,
    ...props
  }: TabItemProps) => {
    console.count('TabItem.render')

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group relative overflow-hidden rounded-md" {...props}>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                isActive
                  ? 'bg-primary/15 text-foreground'
                  : isHighlighted
                    ? 'bg-primary/10 text-foreground'
                    : 'text-foreground hover:bg-muted/50',
                isDiscarded && 'opacity-60 grayscale',
                'transition-all',
              )}
              onClick={onActivate}
              onKeyDown={(e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  e.preventDefault()
                  e.stopPropagation()
                  onRemove()
                }
              }}
            >
              <div
                className={cn(
                  'relative flex h-5 w-5 flex-shrink-0 items-center justify-center',
                  isDiscarded && 'opacity-70',
                )}
              >
                <img
                  src={iconUrl}
                  alt=""
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                  style={{ height: `20px`, width: `20px` }}
                />
                {isDiscarded && (
                  <div className="border-background bg-muted-foreground absolute -bottom-1 -right-1 h-2 w-2 rounded-full border" />
                )}
              </div>
              <span
                className={cn('flex-1 truncate', isActive && 'font-medium')}
              >
                {label}
              </span>
              <div className="hidden w-4 group-hover:flex"></div>
            </button>
            <div className="absolute right-2 top-0 hidden h-full group-hover:flex">
              <button
                type="button"
                onClick={onRemove}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-1"
                title="Close Tab"
                aria-label="Close Tab"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onRemove}>Close Tab</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
)
