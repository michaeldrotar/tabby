import { forwardRef } from 'react'

type OmnibarInputProps = {
  query: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const OmnibarInput = forwardRef<HTMLInputElement, OmnibarInputProps>(
  ({ query, onChange, onKeyDown }, ref) => {
    return (
      <div className="flex items-center border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <svg
          className="mr-3 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={ref}
          type="text"
          className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400 dark:text-gray-100"
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
