import { cn } from '../utils'
import { useEffect, useMemo, useRef, useState } from 'react'

export type Tab = {
  id?: number
  windowId?: number
  title?: string
  url?: string
  favIconUrl?: string
}

export type TabSearchProps<T extends Tab> = {
  tabs: T[]
  onSelectTab: (tab: T) => void
  onClose: () => void
  Favicon: React.ComponentType<{ pageUrl?: string; className?: string }>
  className?: string
}

export const TabSearch = <T extends Tab>({
  tabs,
  onSelectTab,
  onClose,
  Favicon,
  className,
}: TabSearchProps<T>) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    // Focus input on mount
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: 'nearest',
    })
  }, [selectedIndex])

  const filteredTabs = useMemo(() => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()
    return tabs
      .filter(
        (tab) =>
          tab.title?.toLowerCase().includes(lowerQuery) ||
          tab.url?.toLowerCase().includes(lowerQuery),
      )
      .slice(0, 10) // Limit results
  }, [query, tabs])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredTabs.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const tab = filteredTabs[selectedIndex]
      if (tab) {
        onSelectTab(tab)
      }
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden bg-white dark:bg-gray-800',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <svg
          className="mr-3 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400 dark:text-gray-100"
          placeholder="Search tabs..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <kbd className="rounded border border-gray-200 px-1.5 py-0.5 font-sans dark:border-gray-600">
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTabs.length > 0 && (
          <ul className="py-2">
            {filteredTabs.map((tab, index) => (
              <li key={tab.id}>
                <button
                  ref={index === selectedIndex ? selectedItemRef : null}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-left text-sm',
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50',
                  )}
                  onClick={() => onSelectTab(tab)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Favicon pageUrl={tab.url} className="flex-shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{tab.title}</span>
                    <span className="truncate text-xs text-gray-400">
                      {tab.url}
                    </span>
                  </div>
                  {index === selectedIndex && (
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      Jump to
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && filteredTabs.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No tabs found for "{query}"
          </div>
        )}
        {!query && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Type to search across all open tabs
          </div>
        )}
      </div>
    </div>
  )
}
