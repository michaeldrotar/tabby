import { cn } from '../utils'
import { useEffect, useMemo, useRef, useState } from 'react'

export type SearchItem = {
  id: string | number
  type: 'tab' | 'bookmark' | 'history' | 'command' | 'url' | 'search'
  title: string
  url?: string
  favIconUrl?: string
  windowId?: number
  tabId?: number
}

export type OmnibarProps = {
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
    className?: string
  }>
  className?: string
}

export const Omnibar = ({
  tabs,
  onSelect,
  onClose,
  onSearch,
  Favicon,
  className,
}: OmnibarProps) => {
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
      title: 'Search Google',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
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
        title: 'Open URL',
        url: query.includes('://') ? query : `https://${query}`,
      })
    }

    // Commands
    const commands: SearchItem[] = [
      {
        id: 'cmd-side-panel',
        type: 'command' as const,
        title: 'Tabby: Open Tab Manager',
      },
      {
        id: 'cmd-settings',
        type: 'command' as const,
        title: 'Chrome: Open Settings',
        url: 'chrome://settings',
      },
      {
        id: 'cmd-extensions',
        type: 'command' as const,
        title: 'Chrome: Manage Extensions',
        url: 'chrome://extensions',
      },
      {
        id: 'cmd-history',
        type: 'command' as const,
        title: 'Chrome: History',
        url: 'chrome://history',
      },
      {
        id: 'cmd-downloads',
        type: 'command' as const,
        title: 'Chrome: Downloads',
        url: 'chrome://downloads',
      },
      {
        id: 'cmd-bookmarks',
        type: 'command' as const,
        title: 'Chrome: Bookmarks Manager',
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
        return 'Open'
      case 'search':
        return 'Search'
      default:
        return 'Open'
    }
  }

  const getTypeColor = (type: SearchItem['type']) => {
    switch (type) {
      case 'tab':
        return 'text-blue-600 dark:text-blue-400'
      case 'bookmark':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'history':
        return 'text-slate-600 dark:text-slate-400'
      case 'command':
        return 'text-purple-600 dark:text-purple-400'
      case 'url':
        return 'text-green-600 dark:text-green-400'
      case 'search':
        return 'text-indigo-600 dark:text-indigo-400'
      default:
        return 'text-gray-500 dark:text-gray-400'
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
                    'relative flex w-full items-center gap-3 px-4 py-2 text-left text-sm',
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
                    <Favicon pageUrl={item.url} className="flex-shrink-0" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{item.title}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          'flex-shrink-0 font-medium capitalize',
                          getTypeColor(item.type),
                        )}
                      >
                        {item.type}
                      </span>
                      <span className="truncate text-gray-400">{item.url}</span>
                    </div>
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
