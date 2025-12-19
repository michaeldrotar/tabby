import { SearchIcon } from '../icons'
import { Kbd } from '../Kbd'
import { forwardRef } from 'react'

type OmnibarInputProps = {
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const OmnibarInput = forwardRef<HTMLInputElement, OmnibarInputProps>(
  ({ query, onChange, onKeyDown }, ref) => {
    return (
      <div className="flex items-center border-b border-b-accent/[calc(var(--accent-strength)*1%)] px-4 py-3">
        <SearchIcon className="mr-3 h-5 w-5 text-muted" />
        <input
          ref={ref}
          type="text"
          className="flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted"
          placeholder="Search tabs, bookmarks, history..."
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex items-center gap-1 text-xs text-muted">
          <Kbd>Esc</Kbd>
          <span>to close</span>
        </div>
      </div>
    )
  },
)

OmnibarInput.displayName = 'OmnibarInput'
