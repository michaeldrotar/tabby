import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { useOmnibarFiltering } from './useOmnibarFiltering'
import { useOmnibarQuery } from './useOmnibarQuery'
import { useOmnibarSearch } from './useOmnibarSearch'
import { cn } from '../utils/cn'
import { useMemo, useRef, useState } from 'react'
import type { OmnibarSearchItem } from './OmnibarSearchItem'

export type { OmnibarSearchItem } from './OmnibarSearchItem'

export type OmnibarProps = {
  tabs: OmnibarSearchItem[]
  onSelect: (
    item: OmnibarSearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => void
  onClose: () => void
  onSearch?: (query: string) => Promise<OmnibarSearchItem[]>
  Favicon: React.ComponentType<{
    pageUrl?: string
    className?: string
    size?: number
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
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery } = useOmnibarQuery(inputRef)
  const externalResults = useOmnibarSearch(query, onSearch)
  const { filteredItems, selectedIndex, setSelectedIndex } =
    useOmnibarFiltering(query, tabs, externalResults)
  // const selectedItemRef = useOmnibarScroll(selectedIndex)
  const [isCmdCtrlPressed, setIsCmdCtrlPressed] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)

  const originalWindowId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('originalWindowId')
      return id ? parseInt(id, 10) : undefined
    }
    return undefined
  }, [])

  const handleSelect = (
    item: OmnibarSearchItem,
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
                Favicon={Favicon}
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
