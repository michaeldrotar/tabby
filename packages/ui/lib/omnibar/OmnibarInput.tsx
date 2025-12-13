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
      <div className="border-border has-[input:focus-visible]:border-ring/50 flex items-center border-b px-4 py-3">
        <SearchIcon className="text-muted-foreground mr-3 h-5 w-5" />
        <input
          ref={ref}
          type="text"
          className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent text-lg outline-none"
          placeholder="Search tabs, bookmarks, history..."
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <kbd className="border-border bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-sans">
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </div>
    )
  },
)

OmnibarInput.displayName = 'OmnibarInput'
