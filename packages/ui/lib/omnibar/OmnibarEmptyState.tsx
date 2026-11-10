import { CmdIcon, ShiftIcon } from '../icons'
import { Kbd, KbdGroup } from '../Kbd'
import { SummerDetails } from '../SummerTheme'
import { cn } from '../utils/cn'

type QuickAction = {
  id: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
}

type OmnibarEmptyStateProps = {
  query: string
  hasResults: boolean
  quickActions?: QuickAction[]
  isMac?: boolean
}

export const OmnibarEmptyState = ({
  query,
  hasResults,
  quickActions,
  isMac = false,
}: OmnibarEmptyStateProps) => {
  if (hasResults) return null

  if (query) {
    return (
      <div className="px-4 py-8 text-center text-muted">
        No results found for “{query}”. Try a tab title or website address.
      </div>
    )
  }

  return (
    <div className="relative isolate px-4 py-6" data-omnibar-empty>
      <SummerDetails place="search" />
      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="mb-4">
          <h2 className={`mb-2 text-xs font-medium text-muted`}>
            Quick actions
          </h2>
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={cn(
                  `
                    flex items-center gap-3 rounded-lg px-3 py-2 text-left
                    text-foreground transition-colors
                    hover:bg-highlighted/50
                    focus:outline-hidden
                    focus-visible:ring-2 focus-visible:ring-accent
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                    focus-visible:outline-hidden
                  `,
                )}
              >
                <span
                  className={`
                    flex size-8 items-center justify-center rounded-md bg-input
                    text-muted
                  `}
                >
                  {action.icon}
                </span>
                <span className="font-medium">{action.label}</span>
                {action.shortcut && (
                  <Kbd className="ml-auto">{action.shortcut}</Kbd>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div>
        <h2 className={`mb-2 text-xs font-medium text-muted`}>Tips</h2>
        <ul className="stack-y-1.5 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <span>Type to search tabs, bookmarks, and history</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <span>Enter a URL to navigate directly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <span>
              {isMac && (
                <KbdGroup>
                  <Kbd>
                    <CmdIcon />
                  </Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              )}
              {!isMac && (
                <KbdGroup>
                  <Kbd>Ctrl</Kbd>
                  <span>+</span>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              )}
              <span className="ml-1">to open in new tab</span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <span>
              {isMac && (
                <KbdGroup>
                  <Kbd>
                    <ShiftIcon />
                  </Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              )}
              {!isMac && (
                <KbdGroup>
                  <Kbd>Shift</Kbd>
                  <span>+</span>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              )}
              <span className="ml-1">to open in new window</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
