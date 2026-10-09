import { forwardRef } from 'react'
import { SearchIcon } from '../icons'
import { Kbd } from '../Kbd'

type OmnibarInputProps = {
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const OmnibarInput = forwardRef<HTMLInputElement, OmnibarInputProps>(
  ({ query, onChange, onKeyDown }, ref) => {
    return (
      <div
        className={`
          border-b-accent/[calc(var(--accent-strength)*1%)] flex items-center
          border-b px-4 py-3
        `}
      >
        <SearchIcon className="text-muted mr-3 h-5 w-5" />
        <input
          ref={ref}
          type="text"
          className={`
            text-foreground flex-1 bg-transparent text-lg outline-none
            placeholder:text-muted
          `}
          aria-label="Search tabs, groups, bookmarks, and history"
          placeholder="Search tabs, groups, bookmarks, history..."
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="text-muted flex items-center gap-1 text-xs">
          <Kbd>Esc</Kbd>
          <span>to close</span>
        </div>
      </div>
    )
  },
)

OmnibarInput.displayName = 'OmnibarInput'
