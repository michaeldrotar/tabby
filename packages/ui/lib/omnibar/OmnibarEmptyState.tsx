import { CmdIcon, ShiftIcon } from '../icons'
import { Kbd, KbdGroup } from '../Kbd'
import { cn } from '../utils/cn'
import { usePlatformInfo } from '@extension/chrome'

type QuickAction = {
  id: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

type OmnibarEmptyStateProps = {
  query: string
  hasResults: boolean
  quickActions?: QuickAction[]
}

export const OmnibarEmptyState = ({
  query,
  hasResults,
  quickActions,
}: OmnibarEmptyStateProps) => {
  const { data: { os } = {} } = usePlatformInfo()

  if (hasResults) return null

  if (query) {
    return (
      <div className="text-muted px-4 py-8 text-center">
        No results found for "{query}"
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="mb-4">
          <h3 className="text-muted mb-2 text-xs font-medium uppercase tracking-wider">
            Quick Actions
          </h3>
          <div className="flex flex-col gap-1">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  'text-foreground hover:bg-highlighted/50 focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                )}
              >
                <span className="bg-input text-muted flex h-8 w-8 items-center justify-center rounded-md">
                  {action.icon}
                </span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div>
        <h3 className="text-muted mb-2 text-xs font-medium uppercase tracking-wider">
          Tips
        </h3>
        <ul className="text-muted space-y-1.5 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-muted mt-0.5">•</span>
            <span>Type to search tabs, bookmarks, and history</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted mt-0.5">•</span>
            <span>Enter a URL to navigate directly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted mt-0.5">•</span>
            <span>
              {os === 'mac' && (
                <KbdGroup>
                  <Kbd>
                    <CmdIcon />
                  </Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              )}
              {os !== 'mac' && (
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
            <span className="text-muted mt-0.5">•</span>
            <span>
              {os === 'mac' && (
                <KbdGroup>
                  <Kbd>
                    <ShiftIcon />
                  </Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              )}
              {os !== 'mac' && (
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
