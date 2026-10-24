import { forwardRef } from 'react'
import { SearchIcon } from '../icons'
import { Kbd } from '../Kbd'
import { SummerMotionControl } from '../SummerTheme'

type OmnibarInputProps = {
  resultsId: string
  activeResultId?: string
  hasResults: boolean
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const OmnibarInput = forwardRef<HTMLInputElement, OmnibarInputProps>(
  (
    { query, onChange, onKeyDown, resultsId, activeResultId, hasResults },
    ref,
  ) => {
    return (
      <div
        className={`
          border-b-accent-border flex items-center border-b px-4 py-3
          focus-within:border-b-accent
        `}
      >
        <SearchIcon aria-hidden="true" className="text-muted mr-3 h-5 w-5" />
        <input
          ref={ref}
          data-omnibar-query
          type="text"
          name="query"
          role="combobox"
          aria-label="Search tabs, windows, groups, bookmarks, and history"
          aria-autocomplete="list"
          aria-expanded={hasResults}
          aria-controls={hasResults ? resultsId : undefined}
          aria-activedescendant={activeResultId}
          autoComplete="off"
          spellCheck={false}
          className={`
            text-foreground flex-1 bg-transparent text-lg outline-none
            placeholder:text-muted
          `}
          placeholder="Search tabs, windows, groups, bookmarks, history…"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="text-muted flex items-center gap-1 text-xs">
          <SummerMotionControl nightOnly active={!query} />
          <Kbd>Esc</Kbd>
          <span>to close</span>
        </div>
      </div>
    )
  },
)

OmnibarInput.displayName = 'OmnibarInput'
