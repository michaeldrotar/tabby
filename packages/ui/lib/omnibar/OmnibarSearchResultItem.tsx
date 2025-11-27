import { getOmnibarTypeColor } from './getOmnibarTypeColor'
import { cn } from '../utils/cn'
import { formatTimeAgo } from '../utils/formatTimeAgo'
import { useEffect, useRef } from 'react'
import type { OmnibarActionModifier } from './actions/OmnibarActionModifier'
import type { OmnibarSearchResult } from './search/OmnibarSearchResult'

const HighlightedText = ({
  text,
  ranges,
}: {
  text: string
  ranges?: { start: number; end: number }[]
}) => {
  if (!ranges || ranges.length === 0) return <>{text}</>

  const parts: React.ReactNode[] = []
  let lastIndex = 0

  ranges.forEach((range, i) => {
    // Text before match
    if (range.start > lastIndex) {
      parts.push(text.slice(lastIndex, range.start))
    }
    // Match
    parts.push(
      <span key={i} className="font-bold text-blue-600 dark:text-blue-400">
        {text.slice(range.start, range.end)}
      </span>,
    )
    lastIndex = range.end
  })

  // Text after last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

type OmnibarItemProps = {
  item: OmnibarSearchResult
  isSelected: boolean
  onSelect: (
    item: OmnibarSearchResult,
    modifier?: OmnibarActionModifier,
  ) => void
  onMouseMove: () => void
  isShiftPressed: boolean
  isCmdCtrlPressed: boolean
}

export const OmnibarSearchResultItem = ({
  item,
  isSelected,
  onSelect,
  onMouseMove,
  isShiftPressed,
  isCmdCtrlPressed,
}: OmnibarItemProps) => {
  const itemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isSelected) {
      itemRef.current?.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [isSelected])

  const actionText = item.getActionText(
    isShiftPressed ? 'new-window' : isCmdCtrlPressed ? 'new-tab' : undefined,
  )

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
        <item.IconComponent size={32} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">
            <HighlightedText text={item.title} ranges={item.matches.title} />
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex-shrink-0 font-medium capitalize',
                getOmnibarTypeColor(
                  item.type === 'recentlyClosed'
                    ? 'recently-closed'
                    : item.type,
                ),
              )}
            >
              {item.type === 'recentlyClosed' ? 'Recently Closed' : item.type}
            </span>
            {item.supplementalText && (
              <span className="flex-shrink-0 text-gray-400">
                <HighlightedText
                  text={item.supplementalText}
                  ranges={item.matches.supplementalText}
                />
              </span>
            )}
            {item.timestamp && (
              <span className="flex-shrink-0 text-gray-400">
                {formatTimeAgo(item.timestamp)}
              </span>
            )}
            {item.url && (
              <span className="truncate text-gray-400">
                <HighlightedText text={item.url} ranges={item.matches.url} />
              </span>
            )}
          </div>
        </div>
        {isSelected && (
          <span className="flex-shrink-0 text-xs text-gray-400">
            {actionText.primaryText}
            {actionText.secondaryText && (
              <span className="ml-1 opacity-50">
                {actionText.secondaryText}
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  )
}
