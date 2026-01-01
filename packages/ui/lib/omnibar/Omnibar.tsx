import { useMemo, useRef, useState } from 'react'
import { LayoutGridIcon, SettingsIcon } from '../icons'
import { ScrollArea } from '../ScrollArea'
import { cn } from '../utils/cn'
import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { useOmnibarFiltering } from './useOmnibarFiltering'
import { useOmnibarQuery } from './useOmnibarQuery'
import { useOmnibarSearch } from './useOmnibarSearch'
import type { OmnibarSearchResult } from './OmnibarSearchResult'
import type { OmnibarResultGenerators } from './useOmnibarFiltering'

export type { OmnibarSearchResult } from './OmnibarSearchResult'
export type { OmnibarResultGenerators } from './useOmnibarFiltering'

export type OmnibarProps = {
  className?: string
  onDismiss: () => void
  /** Tab data converted to search results */
  tabs: OmnibarSearchResult[]
  /** Search handler for external results (history, bookmarks, closed tabs) */
  onSearch: (query: string) => Promise<OmnibarSearchResult[]>
  /** Generators for creating omnibar result items */
  generators: OmnibarResultGenerators
  /** If true, hides the "Open Tab Manager" quick action (useful when already in Tab Manager) */
  hideTabManagerAction?: boolean
  /** Callback to open the side panel tab manager */
  onOpenTabManager?: () => void
  /** The window ID that originally opened the omnibar (for routing results back) */
  originalWindowId?: number
}

export const Omnibar = ({
  className,
  onDismiss,
  tabs,
  onSearch,
  generators,
  hideTabManagerAction,
  onOpenTabManager,
  originalWindowId,
}: OmnibarProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery } = useOmnibarQuery(inputRef)
  const [isCmdCtrlPressed, setIsCmdCtrlPressed] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  const externalResults = useOmnibarSearch(query, onSearch)
  const { filteredItems, selectedIndex, setSelectedIndex } =
    useOmnibarFiltering(query, tabs, externalResults, generators)

  // Quick actions for empty state
  const quickActions = useMemo(() => {
    const actions = []

    if (!hideTabManagerAction && onOpenTabManager) {
      actions.push({
        id: 'open-tab-manager',
        icon: <LayoutGridIcon className="h-4 w-4" />,
        label: 'Open Tab Manager',
        onClick: () => {
          onOpenTabManager()
          onDismiss()
        },
      })
    }

    actions.push({
      id: 'open-options',
      icon: <SettingsIcon className="h-4 w-4" />,
      label: 'Open Options',
      onClick: () => {
        chrome.runtime.openOptionsPage()
        onDismiss()
      },
    })

    return actions
  }, [hideTabManagerAction, onOpenTabManager, onDismiss])

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
        'flex h-full flex-col bg-card text-card-foreground',
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
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
