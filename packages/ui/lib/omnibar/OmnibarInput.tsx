import { SearchIcon } from '../icons'
import { forwardRef } from 'react'

type OmnibarInputProps = {
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const OmnibarInput = forwardRef<HTMLInputElement, OmnibarInputProps>(
  ({ query, onChange, onKeyDown }, ref) => {
    return (
      <div className="flex items-center border-b border-border/60 px-4 py-3">
        <SearchIcon className="mr-3 h-5 w-5 text-muted-foreground" />
        <input
          ref={ref}
          type="text"
          className="flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
          placeholder="Search tabs, bookmarks, history..."
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <kbd className="rounded border border-border/50 bg-surface-muted px-1.5 py-0.5 font-sans">
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </div>
    )
  },
)

OmnibarInput.displayName = 'OmnibarInput'
