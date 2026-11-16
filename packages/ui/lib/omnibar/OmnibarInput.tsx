import { forwardRef } from 'react'
import { ChevronDownIcon, CloseIcon } from '../icons'
import { SummerMotionControl } from '../SummerTheme'
import { useSurface } from '../Surface'
import { omnibarScopes } from './omnibarScopes'
import type { OmnibarScope } from '@extension/core'

type OmnibarInputProps = {
  scopeMenuOpen: boolean
  onScopeMenuToggle: () => void
  hintId: string
  scope: OmnibarScope
  resultsId: string
  activeResultId?: string
  hasResults: boolean
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onDismiss: () => void
}

export const OmnibarInput = forwardRef<HTMLInputElement, OmnibarInputProps>(
  (
    {
      scopeMenuOpen,
      onScopeMenuToggle,
      hintId,
      scope,
      query,
      onChange,
      onKeyDown,
      onDismiss,
      resultsId,
      activeResultId,
      hasResults,
    },
    ref,
  ) => {
    const surface = useSurface()
    const live = !surface || surface.inputMode === 'live'
    const { icon: ScopeIcon, label, placeholder } = omnibarScopes[scope]
    return (
      <div
        className="
          flex shrink-0 items-center border-b border-b-accent-border px-4 py-3
          focus-within:border-b-accent
        "
      >
        <button
          type="button"
          tabIndex={-1}
          data-omnibar-scope-trigger
          aria-label={`Search scope: ${label}`}
          aria-expanded={scopeMenuOpen}
          aria-haspopup="listbox"
          aria-controls={scopeMenuOpen ? resultsId : undefined}
          aria-keyshortcuts="Tab"
          title={`Search scope: ${label} (Tab)`}
          onClick={onScopeMenuToggle}
          className="
            mr-3 flex h-8 shrink-0 items-center gap-1 rounded-sm px-1 text-muted
            hover:bg-accent-hover hover:text-foreground
          "
        >
          <ScopeIcon aria-hidden="true" className="size-5" />
          <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-60" />
        </button>
        <input
          ref={ref}
          data-omnibar-query
          type="text"
          name="query"
          role="combobox"
          aria-label="Search tabs, bookmarks, history, and more"
          aria-autocomplete="list"
          aria-describedby={hintId}
          aria-expanded={hasResults}
          aria-controls={hasResults ? resultsId : undefined}
          aria-activedescendant={activeResultId}
          autoComplete="off"
          spellCheck={false}
          className="
            min-w-0 flex-1 bg-transparent text-lg text-foreground outline-hidden
            placeholder:text-muted
          "
          placeholder={placeholder}
          value={query}
          onChange={onChange}
          onKeyDown={(event) => {
            if (live && !event.nativeEvent.isComposing) onKeyDown(event)
          }}
          readOnly={!live}
        />
        <div
          data-omnibar-shortcuts
          className="flex shrink-0 items-center gap-1 text-xs text-muted"
        >
          <SummerMotionControl nightOnly active={!query} />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close search"
            title="Close search (Esc)"
            onClick={onDismiss}
            className="
              flex min-h-8 items-center rounded-sm px-2
              hover:bg-accent-hover hover:text-foreground
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-accent
            "
          >
            <CloseIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    )
  },
)
OmnibarInput.displayName = 'OmnibarInput'
