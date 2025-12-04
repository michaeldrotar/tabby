import { formatShortcut } from '@extension/shared'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@extension/ui'
import { useCallback, useState } from 'react'

type SearchButtonProps = {
  onClick?: () => void
}

/**
 * Search button that shows keyboard shortcut in a tooltip on hover.
 * The shortcut is fetched fresh on each hover to ensure it's up-to-date.
 */
export const SearchButton = ({ onClick }: SearchButtonProps) => {
  const [shortcut, setShortcut] = useState<string | null>(null)

  const fetchShortcut = useCallback(() => {
    chrome.commands.getAll().then((commands) => {
      const omnibarCommand = commands.find(
        (cmd) => cmd.name === 'open-omnibar-overlay',
      )
      setShortcut(omnibarCommand?.shortcut || null)
    })
  }, [])

  const tooltipContent = shortcut ? (
    <span>
      Search{' '}
      <kbd className="ml-1 rounded bg-gray-700 px-1 py-0.5 font-sans dark:bg-gray-600">
        {formatShortcut(shortcut)}
      </kbd>
    </span>
  ) : (
    <span>Search</span>
  )

  return (
    <Tooltip onOpenChange={(open) => open && fetchShortcut()}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Search"
          onClick={onClick}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
          )}
        >
          <svg
            className="h-4 w-4"
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
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}
