import { getOmnibarActionLabel } from './getOmnibarActionLabel'
import { getOmnibarTypeColor } from './getOmnibarTypeColor'
import { getOmnibarTypeLabel } from './getOmnibarTypeLabel'
import { cn } from '../utils/cn'
import { formatTimeAgo } from '../utils/formatTimeAgo'
import { useEffect, useRef } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

const HighlightMatch = ({ text, query }: { text?: string; query: string }) => {
  if (!query || !text) return <>{text}</>

  const terms = query.split(/\s+/).filter((term) => term.length > 0)

  if (terms.length === 0) return <>{text}</>

  const escapedTerms = terms.map((term) =>
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = escapedTerms.some((term) =>
          new RegExp(`^${term}$`, 'i').test(part),
        )

        return isMatch ? (
          <span key={i} className="font-bold">
            {part}
          </span>
        ) : (
          part
        )
      })}
    </>
  )
}

type OmnibarItemProps = {
  item: OmnibarSearchResult
  isSelected: boolean
  onSelect: (
    item: OmnibarSearchResult,
    modifier?: 'new-tab' | 'new-window',
  ) => void
  onMouseMove: () => void
  Favicon: React.ComponentType<{
    pageUrl?: string
    className?: string
    size?: number
  }>
  isShiftPressed: boolean
  isCmdCtrlPressed: boolean
  query: string
}

export const OmnibarItem = ({
  item,
  isSelected,
  onSelect,
  onMouseMove,
  Favicon,
  isShiftPressed,
  isCmdCtrlPressed,
  query,
}: OmnibarItemProps) => {
  const itemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isSelected) {
      itemRef.current?.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [isSelected])

  return (
    <li>
      <button
        ref={itemRef}
        type="button"
        className={cn(
          'relative flex w-full items-center gap-3 px-4 py-2 text-left text-sm',
          isSelected
            ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50',
        )}
        onClick={(e) => {
          let modifier: 'new-tab' | 'new-window' | undefined
          if (e.metaKey || e.ctrlKey) modifier = 'new-tab'
          if (e.shiftKey) modifier = 'new-window'
          onSelect(item, modifier)
        }}
        onMouseMove={onMouseMove}
      >
        {item.type === 'command' ? (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            &gt;
          </div>
        ) : item.type === 'search' ? (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <svg viewBox="0 0 24 24" className="h-full w-full">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
        ) : (
          <Favicon
            pageUrl={item.url}
            className="h-8 w-8 flex-shrink-0"
            size={32}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">
            <HighlightMatch text={item.title} query={query} />
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex-shrink-0 font-medium capitalize',
                getOmnibarTypeColor(item.type),
              )}
            >
              {getOmnibarTypeLabel(item)}
            </span>
            {item.tabCount && item.tabCount > 1 && (
              <span className="flex-shrink-0 text-gray-400">
                (+{item.tabCount - 1} others)
              </span>
            )}
            {item.lastVisitTime && (
              <span className="flex-shrink-0 text-gray-400">
                {formatTimeAgo(item.lastVisitTime)}
              </span>
            )}
            <span className="truncate text-gray-400">
              <HighlightMatch text={item.url} query={query} />
            </span>
          </div>
        </div>
        {isSelected && (
          <span className="flex-shrink-0 text-xs text-gray-400">
            {getOmnibarActionLabel(item)}
            {['bookmark', 'history', 'url', 'search'].includes(item.type) && (
              <>
                {isShiftPressed ? (
                  <span className="ml-1 opacity-50"> in New Window</span>
                ) : isCmdCtrlPressed ? (
                  <span className="ml-1 opacity-50"> in New Tab</span>
                ) : null}
              </>
            )}
          </span>
        )}
      </button>
    </li>
  )
}
