import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { searchBookmarks, searchClosedTabs, searchHistory } from './search'
import { useOmnibarFiltering } from './useOmnibarFiltering'
import { useOmnibarQuery } from './useOmnibarQuery'
import { useOmnibarSearch } from './useOmnibarSearch'
import { cn } from '../utils/cn'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export type { OmnibarSearchResult } from './OmnibarSearchResult'

export type OmnibarProps = {
  className?: string
  onDismiss: () => void
}

export const Omnibar = ({ className, onDismiss }: OmnibarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery } = useOmnibarQuery(inputRef)
  const [tabs, setTabs] = useState<OmnibarSearchResult[]>([])
  const [isCmdCtrlPressed, setIsCmdCtrlPressed] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  // Fetch tabs on mount
  useEffect(() => {
    chrome.tabs.query({}).then((response) => {
      if (response) {
        setTabs(
          response.map((t) => ({
            id: t.id || 0,
            type: 'tab',
            title: t.title || 'Untitled',
            url: t.url,
            favIconUrl: t.favIconUrl,
            windowId: t.windowId,
            tabId: t.id,
            execute: async () => {
              if (t.windowId) {
                await chrome.windows.update(t.windowId, { focused: true })
              }
              if (t.id) {
                await chrome.tabs.update(t.id, { active: true })
              }
            },
          })),
        )
      }
    })
  }, [])

  // Search handler for external results (history, bookmarks, closed tabs)
  const handleSearch = useCallback(async (query: string) => {
    const [historyResults, bookmarkResults, closedTabResults] =
      await Promise.all([
        searchHistory(query),
        searchBookmarks(query),
        searchClosedTabs(query),
      ])
    return [
      ...closedTabResults,
      ...bookmarkResults,
      ...historyResults,
    ] as OmnibarSearchResult[]
  }, [])

  const externalResults = useOmnibarSearch(query, handleSearch)
  const { filteredItems, selectedIndex, setSelectedIndex } =
    useOmnibarFiltering(query, tabs, externalResults)

  const originalWindowId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('originalWindowId')
      return id ? parseInt(id, 10) : undefined
    }
    return undefined
  }, [])

  const handleSelect = async (
    item: OmnibarSearchResult,
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
    await item.execute(modifier, originalWindowId)
    onDismiss()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onDismiss()
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
      <OmnibarInput
        ref={inputRef}
        query={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelectedIndex(0)
        }}
        onKeyDown={handleKeyDown}
      />

      <div className="flex-1 overflow-y-auto">
        {filteredItems.length > 0 && (
          <ul className="py-2">
            {filteredItems.map((item, index) => (
              <OmnibarItem
                key={item.id}
                item={item}
                isSelected={index === selectedIndex}
                onSelect={(item, modifier) =>
                  handleSelect(item, modifier, originalWindowId)
                }
                onMouseMove={() => setSelectedIndex(index)}
                isShiftPressed={isShiftPressed}
                isCmdCtrlPressed={isCmdCtrlPressed}
                query={query}
                // ref={index === selectedIndex ? selectedItemRef : null}
              />
            ))}
          </ul>
        )}

        <OmnibarEmptyState
          query={query}
          hasResults={filteredItems.length > 0}
        />
      </div>
    </div>
  )
}
