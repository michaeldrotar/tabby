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
      <div className="flex items-center border-b border-gray-300 px-4 py-3 dark:border-gray-700">
        <SearchIcon className="mr-3 h-5 w-5 text-gray-400" />
        <input
          ref={ref}
          type="text"
          className="flex-1 bg-transparent text-lg text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          placeholder="Search tabs, bookmarks, history..."
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <kbd className="rounded border border-gray-200 px-1.5 py-0.5 font-sans dark:border-gray-600">
            ESC
          </kbd>
          <span>to close</span>
        </div>
      </div>
    )
  },
)

OmnibarInput.displayName = 'OmnibarInput'
