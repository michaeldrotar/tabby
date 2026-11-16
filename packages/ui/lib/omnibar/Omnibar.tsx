import { formatShortcut } from '@extension/shared/utils/platform'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LayoutGridIcon, SettingsIcon } from '../icons'
import { ScrollArea } from '../ScrollArea'
import { useSurfaceId } from '../Surface'
import { cn } from '../utils/cn'
import { OmnibarEmptyState } from './OmnibarEmptyState'
import { OmnibarInput } from './OmnibarInput'
import { OmnibarItem } from './OmnibarItem'
import { OmnibarScopeChoices, scopeLetters } from './OmnibarScopeChoices'
import { omnibarScopeEntries, omnibarScopes } from './omnibarScopes'
import { useOmnibarQuery } from './useOmnibarQuery'
import type { OmnibarSearchResult } from './OmnibarSearchResult'
import type { OmnibarScope } from '@extension/core'
import type { Dispatch, SetStateAction } from 'react'

export type { OmnibarSearchResult } from './OmnibarSearchResult'
export type OmnibarProps = {
  className?: string
  onDismiss: () => void
  results: OmnibarSearchResult[]
  hideTabManagerAction?: boolean
  onOpenTabManager?: () => void | Promise<void>
  openTabManagerShortcut?: string
  originalWindowId?: number
  isMac?: boolean
  scope?: OmnibarScope
  onScopeChange?: (scope: OmnibarScope) => void
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
  results,
  hideTabManagerAction,
  onOpenTabManager,
  openTabManagerShortcut,
  originalWindowId,
  isMac = false,
  scope: controlledScope,
  onScopeChange,
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
  const resultsId = useSurfaceId('search-results')
  const scopeListId = useSurfaceId('scope-choices')
  const hintId = useSurfaceId('search-keyboard-hint')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const localQuery = useOmnibarQuery(inputRef, controlledQuery, autofocus)
  const query = controlledQuery ?? localQuery.query
  const setQuery = onQueryChange ?? localQuery.setQuery
  const hasQuery = !!query.trim()
  const [localScope, setLocalScope] = useState<OmnibarScope>('all')
  const scope = controlledScope ?? localScope
  const setScope = onScopeChange ?? setLocalScope
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false)
  const [highlightedScope, setHighlightedScope] = useState<OmnibarScope>(scope)
  const [localModifiers, setLocalModifiers] = useState({
    command: false,
    shift: false,
  })
  const currentModifiers = modifiers ?? localModifiers
  const setModifiers = onModifiersChange ?? setLocalModifiers
  const [localIndex, setLocalIndex] = useState(0)
  const setSelectedIndex = onSelectedIndexChange ?? setLocalIndex
  useLayoutEffect(() => {
    if (scrollTop === undefined) return
    const viewport = rootRef.current?.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]',
    )
    if (viewport && viewport.scrollTop !== scrollTop)
      viewport.scrollTop = scrollTop
  }, [scrollTop])
  const toggleScopeMenu = () => {
    setHighlightedScope(scope)
    setScopeMenuOpen(!scopeMenuOpen)
    inputRef.current?.focus()
  }
  const moveScopeHighlight = (direction: number) => {
    setHighlightedScope((current) => {
      const index = omnibarScopeEntries.findIndex(
        ([value]) => value === current,
      )
      return omnibarScopeEntries[
        (index + direction + omnibarScopeEntries.length) %
          omnibarScopeEntries.length
      ]![0]
    })
  }
  const changeScope = (next: OmnibarScope) => {
    setSelectedIndex(0)
    setScope(next)
    setScopeMenuOpen(false)
    inputRef.current?.focus()
  }
  const highlightPattern = useMemo(() => {
    const terms = query
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return terms.length ? new RegExp(`(${terms.join('|')})`, 'gi') : null
  }, [query])
  const openTabManager = useCallback(async () => {
    if (!onOpenTabManager) return
    try {
      await onOpenTabManager()
      onDismiss()
    } catch (error) {
      onError?.(error)
    }
  }, [onDismiss, onOpenTabManager, onError])
  const quickActions = useMemo(() => {
    const actions = []
    if (!hideTabManagerAction && onOpenTabManager)
      actions.push({
        id: 'open-tab-manager',
        icon: <LayoutGridIcon className="size-4" />,
        label: 'Open tab manager',
        shortcut: formatShortcut(openTabManagerShortcut, isMac),
        onClick: openTabManager,
      })
    if (onOpenOptions)
      actions.push({
        id: 'open-options',
        icon: <SettingsIcon className="size-4" />,
        label: 'Open options',
        onClick: async () => {
          try {
            await onOpenOptions()
            onDismiss()
          } catch (error) {
            onError?.(error)
          }
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
  const broaderScope = scope === 'current-window' ? 'tabs' : 'all'
  const BroaderScopeIcon = omnibarScopes[broaderScope].icon
  const emptyActions =
    scope !== 'all'
      ? [
          {
            id: 'broaden-search',
            icon: <BroaderScopeIcon className="size-4" />,
            label:
              broaderScope === 'tabs' ? 'Search all tabs' : 'Search everything',
            shortcut: 'Enter',
            onClick: () => changeScope(broaderScope),
          },
        ]
      : !hasQuery
        ? quickActions
        : []
  const itemCount =
    results.length ||
    (scope !== 'all' ? 1 : !hasQuery ? quickActions.length : 0)
  const selectedIndex = Math.max(
    0,
    Math.min(controlledIndex ?? localIndex, itemCount - 1),
  )
  const handleSelect = async (
    item: OmnibarSearchResult,
    modifier?: 'new-tab' | 'new-window',
  ) => {
    try {
      await item.execute(
        item.type === 'window' ? undefined : modifier,
        originalWindowId,
      )
      onDismiss()
    } catch (error) {
      onError?.(error)
    }
  }
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Unhandled modifier combinations belong to the text field or browser.
    if (
      (event.metaKey || event.ctrlKey || event.altKey) &&
      !(event.key === 'Enter' && !event.altKey)
    )
      return
    if (event.shiftKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) return
    if (event.key === 'Tab') {
      event.preventDefault()
      if (scopeMenuOpen) moveScopeHighlight(event.shiftKey ? -1 : 1)
      else toggleScopeMenu()
      return
    }
    if (scopeMenuOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveScopeHighlight(event.key === 'ArrowDown' ? 1 : -1)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        changeScope(highlightedScope)
        return
      }
      const choice = omnibarScopeEntries.find(
        ([value]) => scopeLetters[value] === event.key.toLowerCase(),
      )
      if (choice) {
        event.preventDefault()
        changeScope(choice[0])
        return
      }
      if (event.key.length === 1 || ['Backspace', 'Delete'].includes(event.key))
        setScopeMenuOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex(Math.min(selectedIndex + 1, Math.max(0, itemCount - 1)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(Math.max(selectedIndex - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = results[selectedIndex]
      if (item) {
        const modifier = event.shiftKey
          ? 'new-window'
          : event.metaKey || event.ctrlKey
            ? 'new-tab'
            : undefined
        void handleSelect(item, modifier)
      } else void emptyActions[selectedIndex]?.onClick()
    }
  }
  const handleContainerKeyDown = (event: React.KeyboardEvent) => {
    if (event.defaultPrevented || event.nativeEvent.isComposing) return
    if (
      event.key === 'Escape' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault()
      event.stopPropagation()
      if (scopeMenuOpen) {
        setScopeMenuOpen(false)
        inputRef.current?.focus()
      } else onDismiss()
      return
    }
    if (event.key === 'Meta' || event.key === 'Control')
      setModifiers({ ...currentModifiers, command: true })
    if (event.key === 'Shift')
      setModifiers({ ...currentModifiers, shift: true })
  }
  return (
    <div
      ref={rootRef}
      data-omnibar
      className={cn(
        'relative isolate flex h-full flex-col bg-card text-card-foreground',
        className,
      )}
      role="search"
      aria-label="Tabby search"
      onMouseDownCapture={(event) => {
        if (
          event.button === 0 &&
          (event.target as HTMLElement).closest('button')
        )
          event.preventDefault()
      }}
      onPointerDownCapture={(event) => {
        if (
          scopeMenuOpen &&
          !(event.target as HTMLElement).closest(
            '[data-omnibar-scope-list], [data-omnibar-scope-trigger]',
          )
        )
          setScopeMenuOpen(false)
      }}
      onScrollCapture={(event) => {
        const viewport = event.target as HTMLElement
        if (viewport.hasAttribute('data-radix-scroll-area-viewport'))
          onScrollChange?.(viewport.scrollTop)
      }}
      onKeyDownCapture={handleContainerKeyDown}
      onKeyUpCapture={(event) => {
        if (event.key === 'Meta' || event.key === 'Control')
          setModifiers({ ...currentModifiers, command: false })
        if (event.key === 'Shift')
          setModifiers({ ...currentModifiers, shift: false })
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setModifiers({ command: false, shift: false })
      }}
    >
      <h1 className="sr-only">Tabby search</h1>
      <OmnibarInput
        ref={inputRef}
        scope={scope}
        scopeMenuOpen={scopeMenuOpen}
        onScopeMenuToggle={toggleScopeMenu}
        hintId={hintId}
        resultsId={scopeMenuOpen ? scopeListId : resultsId}
        hasResults={scopeMenuOpen || itemCount > 0}
        activeResultId={
          scopeMenuOpen
            ? `${scopeListId}-${highlightedScope}`
            : itemCount
              ? `${resultsId}-${selectedIndex}`
              : undefined
        }
        query={query}
        onChange={(event) => {
          setSelectedIndex(0)
          setQuery(event.target.value)
        }}
        onKeyDown={handleKeyDown}
        onDismiss={onDismiss}
      />
      <ScrollArea orientation="vertical" className="flex-1">
        {scopeMenuOpen ? (
          <div className="px-3 py-2">
            <p className="px-3 py-2 text-xs font-medium text-muted">
              Search scope
            </p>
            <OmnibarScopeChoices
              id={scopeListId}
              scope={scope}
              highlighted={highlightedScope}
              onHighlight={setHighlightedScope}
              onChange={changeScope}
            />
          </div>
        ) : (
          <>
            {results.length > 0 && (
              <ul
                id={resultsId}
                role="listbox"
                aria-label="Search results"
                className="py-2"
              >
                {results.map((item, index) => (
                  <OmnibarItem
                    key={item.id}
                    resultId={`${resultsId}-${index}`}
                    item={item}
                    isSelected={index === selectedIndex}
                    onSelect={handleSelect}
                    onMouseMove={() => setSelectedIndex(index)}
                    isShiftPressed={currentModifiers.shift}
                    isCmdCtrlPressed={currentModifiers.command}
                    highlightPattern={highlightPattern}
                  />
                ))}
              </ul>
            )}
            <OmnibarEmptyState
              query={query}
              hasResults={results.length > 0}
              actions={emptyActions}
              resultsId={resultsId}
              selectedIndex={selectedIndex}
              onSelectedIndexChange={setSelectedIndex}
              scope={scope}
              onChooseScope={toggleScopeMenu}
              isMac={isMac}
            />
          </>
        )}
      </ScrollArea>
      <p id={hintId} className="sr-only">
        Search scope: {omnibarScopes[scope].label}. Press Tab to open scope
        choices, then Tab or Shift+Tab to cycle through them. Choose a letter,
        or use the arrow keys and Enter. Escape cancels scope selection or
        closes search.
      </p>
      <p className="sr-only" role="status" aria-atomic="true">
        Search scope: {omnibarScopes[scope].label}.{' '}
        {hasQuery || results.length
          ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
          : ''}
      </p>
    </div>
  )
}
