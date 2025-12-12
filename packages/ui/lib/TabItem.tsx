import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ContextMenu'
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
                  ? 'bg-blue-200 text-blue-900 dark:bg-indigo-500/20 dark:text-indigo-100'
                  : isHighlighted
                    ? 'bg-blue-100 text-blue-900 dark:bg-indigo-500/10 dark:text-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800/50',
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
                  <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-white bg-gray-400 dark:border-gray-900" />
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
                className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                title="Close Tab"
                aria-label="Close Tab"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 18 12" />
                </svg>
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
