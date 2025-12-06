import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { searchBookmarks, searchClosedTabs, searchHistory } from './search'
import { useOmnibarFiltering } from './useOmnibarFiltering'
import { useOmnibarQuery } from './useOmnibarQuery'
import { useOmnibarSearch } from './useOmnibarSearch'
import { ScrollArea } from '../ScrollArea'
import { cn } from '../utils/cn'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { OmnibarSearchResult } from './OmnibarSearchResult'

export type { OmnibarSearchResult } from './OmnibarSearchResult'

export type OmnibarProps = {
  className?: string
  onDismiss: () => void
  /** If true, hides the "Open Tab Manager" quick action (useful when already in Tab Manager) */
  hideTabManagerAction?: boolean
}

export const Omnibar = ({
  className,
  onDismiss,
  hideTabManagerAction,
}: OmnibarProps) => {
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
            lastVisitTime: t.lastAccessed,
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

  // Quick actions for empty state
  const quickActions = useMemo(() => {
    const actions = []

    if (!hideTabManagerAction) {
      actions.push({
        id: 'open-tab-manager',
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
        label: 'Open Tab Manager',
        onClick: async () => {
          const windowId =
            originalWindowId ||
            (await chrome.windows.getLastFocused()).id ||
            undefined
          if (windowId) {
            await chrome.sidePanel.open({ windowId })
          }
          onDismiss()
        },
      })
    }

    actions.push({
      id: 'open-options',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      label: 'Open Options',
      onClick: async () => {
        chrome.runtime.openOptionsPage()
        onDismiss()
      },
    })

    return actions
  }, [hideTabManagerAction, originalWindowId, onDismiss])

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
    if (e.key === 'ArrowDown') {
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
    if (e.key === 'Escape') {
      onDismiss()
      return
    }
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
        'flex h-full flex-col bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100',
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

      <ScrollArea orientation="vertical" className="flex-1">
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
          quickActions={quickActions}
        />
      </ScrollArea>
    </div>
  )
}
