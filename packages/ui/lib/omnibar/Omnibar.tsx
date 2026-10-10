import { formatShortcut } from '@extension/shared/utils/platform'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LayoutGridIcon, SettingsIcon } from '../icons'
import { ScrollArea } from '../ScrollArea'
import { cn } from '../utils/cn'
import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { useOmnibarQuery } from './useOmnibarQuery'
import type { OmnibarSearchResult } from './OmnibarSearchResult'
import type { Dispatch, SetStateAction } from 'react'

export type { OmnibarSearchResult } from './OmnibarSearchResult'

export type OmnibarProps = {
  className?: string
  onDismiss: () => void
  /** Results arranged by the application for the current query. */
  results: OmnibarSearchResult[]
  /** If true, hides the "Open Tab Manager" quick action (useful when already in Tab Manager) */
  hideTabManagerAction?: boolean
  /** Callback to open the side panel tab manager */
  onOpenTabManager?: () => void | Promise<void>
  /** The active Chrome command shortcut for opening the side panel */
  openTabManagerShortcut?: string
  /** The window ID that originally opened the omnibar (for routing results back) */
  originalWindowId?: number
  /** Whether running on macOS (for keyboard shortcuts) */
  isMac?: boolean
  query?: string
  onQueryChange?: (query: string) => void
  selectedIndex?: number
  onSelectedIndexChange?: Dispatch<SetStateAction<number>>
  modifiers?: { command: boolean; shift: boolean }
  onModifiersChange?: (modifiers: { command: boolean; shift: boolean }) => void
  onOpenOptions?: () => void | Promise<void>
  onError?: (error: unknown) => void
  scrollTop?: number
  onScrollChange?: (top: number) => void
  autofocus?: boolean
}

export const Omnibar = ({
  className,
  onDismiss,
  results: filteredItems,
  hideTabManagerAction,
  onOpenTabManager,
  openTabManagerShortcut,
  originalWindowId,
  isMac = false,
  query: controlledQuery,
  onQueryChange,
  selectedIndex: controlledIndex,
  onSelectedIndexChange,
  modifiers,
  onModifiersChange,
  onOpenOptions,
  onError,
  autofocus = true,
  scrollTop,
  onScrollChange,
}: OmnibarProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (scrollTop === undefined) return
    const viewport = rootRef.current?.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]',
    )
    if (viewport && viewport.scrollTop !== scrollTop)
      viewport.scrollTop = scrollTop
  }, [scrollTop])
  const inputRef = useRef<HTMLInputElement>(null)
  const localQuery = useOmnibarQuery(inputRef, controlledQuery, autofocus)
  const query = controlledQuery ?? localQuery.query
  const setQuery = onQueryChange ?? localQuery.setQuery
  const [localModifiers, setLocalModifiers] = useState({
    command: false,
    shift: false,
  })
  const currentModifiers = modifiers ?? localModifiers
  const setModifiers = onModifiersChange ?? setLocalModifiers
  const isCmdCtrlPressed = currentModifiers.command
  const isShiftPressed = currentModifiers.shift

  const [localIndex, setLocalIndex] = useState(0)
  const selectedIndex = Math.max(
    0,
    Math.min(controlledIndex ?? localIndex, filteredItems.length - 1),
  )
  const setSelectedIndex = onSelectedIndexChange ?? setLocalIndex

  const openTabManager = useCallback(() => {
    if (!onOpenTabManager) return

    void Promise.resolve(onOpenTabManager())
      .then(onDismiss)
      .catch((error) => {
        onError?.(error)
      })
  }, [onDismiss, onOpenTabManager, onError])

  // Quick actions for empty state
  const quickActions = useMemo(() => {
    const actions = []

    if (!hideTabManagerAction && onOpenTabManager) {
      actions.push({
        id: 'open-tab-manager',
        icon: <LayoutGridIcon className="h-4 w-4" />,
        label: 'Open Tab Manager',
        shortcut: formatShortcut(openTabManagerShortcut, isMac),
        onClick: openTabManager,
      })
    }

    if (onOpenOptions)
      actions.push({
        id: 'open-options',
        icon: <SettingsIcon className="h-4 w-4" />,
        label: 'Open Options',
        onClick: () => {
          void Promise.resolve(onOpenOptions()).then(onDismiss).catch(onError)
        },
      })

    return actions
  }, [
    hideTabManagerAction,
    isMac,
    onDismiss,
    onOpenTabManager,
    onOpenOptions,
    onError,
    openTabManager,
    openTabManagerShortcut,
  ])

  const handleSelect = async (
    item: OmnibarSearchResult,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => {
    try {
      await item.execute(modifier, originalWindowId)
      onDismiss()
    } catch (error) {
      onError?.(error)
    }
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
    if (e.key === 'Meta' || e.key === 'Control')
      setModifiers({ ...currentModifiers, command: true })
    if (e.key === 'Shift') setModifiers({ ...currentModifiers, shift: true })
  }

  const handleContainerKeyUp = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Meta' || e.key === 'Control')
      setModifiers({ ...currentModifiers, command: false })
    if (e.key === 'Shift') setModifiers({ ...currentModifiers, shift: false })
  }

  return (
    <div
      ref={rootRef}
      data-omnibar
      onScrollCapture={(event) => {
        const viewport = event.target as HTMLElement
        if (viewport.hasAttribute('data-radix-scroll-area-viewport'))
          onScrollChange?.(viewport.scrollTop)
      }}
      className={cn(
        'bg-card text-card-foreground flex h-full flex-col',
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={handleContainerKeyDown}
      onKeyUp={handleContainerKeyUp}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setModifiers({ command: false, shift: false })
      }}
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
              />
            ))}
          </ul>
        )}

        <OmnibarEmptyState
          query={query}
          hasResults={filteredItems.length > 0}
          quickActions={quickActions}
          isMac={isMac}
        />
      </ScrollArea>
    </div>
  )
}
