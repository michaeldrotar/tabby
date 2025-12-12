import { formatShortcut } from '@extension/shared'
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  SearchIcon,
} from '@extension/ui'
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
      <kbd className="border-border bg-muted text-muted-foreground ml-1 rounded border px-1 py-0.5 font-sans">
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
            'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  )
}
