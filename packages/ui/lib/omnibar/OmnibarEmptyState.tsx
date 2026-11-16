import { CmdIcon, ShiftIcon } from '../icons'
import { Kbd, KbdGroup } from '../Kbd'
import { SummerDetails } from '../SummerTheme'
import { cn } from '../utils/cn'
import { omnibarScopes } from './omnibarScopes'
import type { OmnibarScope } from '@extension/core'

type EmptyAction = {
  id: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
}

type OmnibarEmptyStateProps = {
  onChooseScope?: () => void
  query: string
  hasResults: boolean
  actions: EmptyAction[]
  resultsId: string
  selectedIndex: number
  onSelectedIndexChange: (index: number) => void
  isMac?: boolean
  scope?: OmnibarScope
}

export const OmnibarEmptyState = ({
  onChooseScope,
  query,
  hasResults,
  actions,
  resultsId,
  selectedIndex,
  onSelectedIndexChange,
  isMac = false,
  scope = 'all',
}: OmnibarEmptyStateProps) => {
  if (hasResults) return null
  const actionList = actions.length > 0 && (
    <div
      id={resultsId}
      role="listbox"
      aria-label={scope === 'all' ? 'Quick actions' : 'Search suggestions'}
      className="flex flex-col gap-1"
    >
      {actions.map((action, index) => (
        <button
          tabIndex={-1}
          key={action.id}
          id={`${resultsId}-${index}`}
          role="option"
          aria-selected={index === selectedIndex}
          type="button"
          onClick={action.onClick}
          onMouseMove={() => onSelectedIndexChange(index)}
          className={cn(
            `
              flex items-center gap-3 rounded-lg px-3 py-2 text-left
              text-foreground transition-colors
              focus:outline-hidden
              focus-visible:ring-2 focus-visible:ring-accent
              focus-visible:ring-offset-2 focus-visible:ring-offset-background
              focus-visible:outline-hidden
            `,
            index === selectedIndex
              ? 'bg-accent-selected'
              : 'hover:bg-highlighted/50',
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
          {action.shortcut && <Kbd className="ml-auto">{action.shortcut}</Kbd>}
        </button>
      ))}
    </div>
  )
  if (scope !== 'all' || query.trim()) {
    const empty = query.trim()
      ? omnibarScopes[scope].empty
      : scope === 'current-window'
        ? 'No tabs in the current window.'
        : scope === 'recently-closed'
          ? 'No recently closed tabs.'
          : `No ${omnibarScopes[scope].label.toLowerCase()} to show.`
    return (
      <div className="px-4 py-6" data-omnibar-empty>
        <p className="pt-2 pb-4 text-center text-muted">{empty}</p>
        {actionList}
      </div>
    )
  }

  return (
    <div className="relative isolate px-4 py-6" data-omnibar-empty>
      <SummerDetails place="search" />
      {actionList && (
        <div className="mb-4">
          <h2 className={`mb-2 text-xs font-medium text-muted`}>
            Quick actions
          </h2>
          {actionList}
        </div>
      )}

      <div>
        <h2 className={`mb-2 text-xs font-medium text-muted`}>Tips</h2>
        <ul className="stack-y-1.5 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <span>
              {omnibarScopes[scope].placeholder.replace(/…|\.\.\./g, '')}
            </span>
          </li>
          {scope === 'all' && (
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-muted">•</span>
              <span>Enter a URL to navigate directly</span>
            </li>
          )}
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
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <button
              type="button"
              tabIndex={-1}
              onClick={onChooseScope}
              className="
                rounded-sm text-left
                hover:text-foreground
                focus-visible:outline-2 focus-visible:outline-accent
              "
            >
              <Kbd>Tab</Kbd>{' '}
              <span className="ml-1">to change search scope</span>
            </button>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-muted">•</span>
            <span>
              <Kbd>Esc</Kbd> <span className="ml-1">to close search</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
