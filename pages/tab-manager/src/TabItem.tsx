import { cn } from '@extension/ui'
import { memo } from 'react'
import type { BrowserTabID } from '@extension/chrome'

export type TabItemProps = {
  tabId: BrowserTabID
  label: string
  iconUrl: string
  isActive: boolean
  isDiscarded: boolean
  isHighlighted: boolean
  onActivate: () => void
  onRefresh: () => void
  onRemove: () => void
}

export const TabItem = memo(
  ({
    tabId,
    label,
    iconUrl,
    isActive,
    isDiscarded,
    isHighlighted,
    onActivate,
    onRefresh,
    onRemove,
  }: TabItemProps) => {
    console.count('TabItem.render')

    return (
      <div className="group relative overflow-hidden rounded-md">
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            isActive
              ? 'bg-blue-200 text-blue-900 dark:bg-blue-900/60 dark:text-blue-50'
              : isHighlighted
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
            isDiscarded && 'opacity-60 grayscale',
            'transition-all',
          )}
          onClick={onActivate}
          data-tab-button={tabId}
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
          <span className={cn('flex-1 truncate', isActive && 'font-medium')}>
            {label}
          </span>
          <div className="hidden w-10 group-hover:flex"></div>
        </button>
        <div className="absolute right-0 top-0 hidden h-full group-hover:flex">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded p-1 text-gray-400 hover:bg-blue-200 hover:text-blue-700 dark:hover:bg-blue-700/30 dark:hover:text-blue-200"
            title="Refresh Tab"
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
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Close Tab"
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
    )
  },
)
