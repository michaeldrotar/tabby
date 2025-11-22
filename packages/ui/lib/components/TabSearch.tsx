import { cn } from '../utils'
import { useEffect, useMemo, useRef, useState } from 'react'

export type SearchItem = {
  id: string | number
  type: 'tab' | 'bookmark' | 'history' | 'command' | 'url' | 'search'
  title: string
  url?: string
  description?: string
  favIconUrl?: string
  windowId?: number
  tabId?: number
}

export type TabSearchProps = {
  tabs: SearchItem[]
  onSelect: (
    item: SearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => void
  onClose: () => void
  onSearch?: (query: string) => Promise<SearchItem[]>
  Favicon: React.ComponentType<{
    pageUrl?: string
    favIconUrl?: string
    className?: string
  }>
  className?: string
}

export const TabSearch = ({
  tabs,
  onSelect,
  onClose,
  onSearch,
  Favicon,
  className,
}: TabSearchProps) => {
  const [query, setQuery] = useState('')
  const [externalResults, setExternalResults] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedItemRef = useRef<HTMLButtonElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isCmdCtrlPressed, setIsCmdCtrlPressed] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load last query
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.get('lastQuery').then((res) => {
        if (res.lastQuery) {
          setQuery(res.lastQuery)
        }
        setIsLoaded(true)

        // Focus and select
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
            if (res.lastQuery) {
              inputRef.current.select()
            }
          }
        }, 50)
      })
    } else {
      setIsLoaded(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [])

  useEffect(() => {
    if (
      isLoaded &&
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ lastQuery: query })
    }
  }, [query, isLoaded])

  const originalWindowId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('originalWindowId')
      return id ? parseInt(id, 10) : undefined
    }
    return undefined
  }, [])

  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({
      block: 'nearest',
    })
  }, [selectedIndex])

  useEffect(() => {
    if (!query || !onSearch) {
      setExternalResults([])
      return
    }
    const timer = setTimeout(() => {
      onSearch(query).then(setExternalResults)
    }, 200)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  const filteredItems = useMemo(() => {
    if (!query) return []
    const lowerQuery = query.toLowerCase()

    // Google Search (Always First)
    const googleSearch: SearchItem = {
      id: 'search-google',
      type: 'search',
      title: query,
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      description: 'Search Google',
    }

    // URL (Only if valid)
    const urlResults: SearchItem[] = []
    const isUrl =
      /^https?:\/\//.test(query) ||
      (!query.includes(' ') && query.includes('.'))
    if (isUrl) {
      urlResults.push({
        id: 'url-go',
        type: 'url',
        title: query,
        url: query.includes('://') ? query : `https://${query}`,
        description: 'Go to URL',
      })
    }

    // Commands
    const commands: SearchItem[] = [
      {
        id: 'cmd-side-panel',
        type: 'command' as const,
        title: 'Open Side Panel',
        description: 'Tabby: Open Side Panel',
      },
      {
        id: 'cmd-settings',
        type: 'command' as const,
        title: 'Open Settings',
        description: 'Chrome: Open Settings',
        url: 'chrome://settings',
      },
      {
        id: 'cmd-extensions',
        type: 'command' as const,
        title: 'Manage Extensions',
        description: 'Chrome: Manage Extensions',
        url: 'chrome://extensions',
      },
      {
        id: 'cmd-history',
        type: 'command' as const,
        title: 'History',
        description: 'Chrome: History',
        url: 'chrome://history',
      },
      {
        id: 'cmd-downloads',
        type: 'command' as const,
        title: 'Downloads',
        description: 'Chrome: Downloads',
        url: 'chrome://downloads',
      },
      {
        id: 'cmd-bookmarks',
        type: 'command' as const,
        title: 'Bookmarks Manager',
        description: 'Chrome: Bookmarks Manager',
        url: 'chrome://bookmarks',
      },
    ].filter((c) => c.title.toLowerCase().includes(lowerQuery))

    // Local tabs
    const localResults = tabs
      .filter(
        (tab) =>
          tab.title?.toLowerCase().includes(lowerQuery) ||
          tab.url?.toLowerCase().includes(lowerQuery),
      )
      .map((t) => ({ ...t, type: 'tab' as const }))

    // External Results (Bookmarks & History)
    const bookmarks = externalResults.filter((i) => i.type === 'bookmark')
    const history = externalResults.filter((i) => i.type === 'history')

    return [
      ...urlResults,
      googleSearch,
      ...commands,
      ...localResults,
      ...bookmarks,
      ...history,
    ].slice(0, 20)
  }, [query, tabs, externalResults])

  const handleSelect = (
    item: SearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => {
    if (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.remove('lastQuery')
    }
    onSelect(item, modifier, originalWindowId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filteredItems[selectedIndex]
      if (item) {
        let modifier: 'new-tab' | 'new-window' | undefined
        if (e.metaKey || e.ctrlKey) modifier = 'new-tab'
        if (e.shiftKey) modifier = 'new-window'
        handleSelect(item, modifier, originalWindowId)
      }
    }
  }

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Meta' || e.key === 'Control') setIsCmdCtrlPressed(true)
    if (e.key === 'Shift') setIsShiftPressed(true)
  }

  const handleContainerKeyUp = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Meta' || e.key === 'Control') setIsCmdCtrlPressed(false)
    if (e.key === 'Shift') setIsShiftPressed(false)
  }

  const getActionLabel = (item: SearchItem) => {
    switch (item.type) {
      case 'tab':
        return 'Jump to'
      case 'command':
        return 'Run'
      case 'url':
        return 'Go'
      case 'search':
        return 'Search'
      default:
        return 'Open'
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
      onKeyDown={handleContainerKeyDown}
      onKeyUp={handleContainerKeyUp}
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
          placeholder="Search tabs, bookmarks, history..."
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
        {filteredItems.length > 0 && (
          <ul className="py-2">
            {filteredItems.map((item, index) => (
              <li key={item.id}>
                <button
                  ref={index === selectedIndex ? selectedItemRef : null}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-left text-sm',
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50',
                  )}
                  onClick={(e) => {
                    let modifier: 'new-tab' | 'new-window' | undefined
                    if (e.metaKey || e.ctrlKey) modifier = 'new-tab'
                    if (e.shiftKey) modifier = 'new-window'
                    handleSelect(item, modifier, originalWindowId)
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {item.type === 'command' ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded bg-gray-200 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      &gt;
                    </div>
                  ) : (
                    <Favicon
                      pageUrl={item.url}
                      favIconUrl={item.favIconUrl}
                      className="flex-shrink-0"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{item.title}</span>
                    <span className="truncate text-xs text-gray-400">
                      {item.description || item.url}
                    </span>
                  </div>
                  {index === selectedIndex && (
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {getActionLabel(item)}
                      {['bookmark', 'history', 'url', 'search'].includes(
                        item.type,
                      ) && (
                        <>
                          {isShiftPressed ? (
                            <span className="ml-1 opacity-50">
                              {' '}
                              in New Window
                            </span>
                          ) : isCmdCtrlPressed ? (
                            <span className="ml-1 opacity-50"> in New Tab</span>
                          ) : null}
                        </>
                      )}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {query && filteredItems.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </div>
        )}
        {!query && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">
            Type to search tabs, bookmarks, history, or enter a URL
          </div>
        )}
      </div>
    </div>
  )
}
