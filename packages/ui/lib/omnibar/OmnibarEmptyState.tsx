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
  const { data: platformInfo } = usePlatformInfo()
  const platformModifier = platformInfo?.os === 'mac' ? '⌘' : 'Ctrl'

  if (hasResults) return null

  if (query) {
    return (
      <div className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
        No results found for "{query}"
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      {/* Quick Actions */}
      {quickActions && quickActions.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-neutral-500">
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
                  'text-slate-700 hover:bg-stone-100',
                  'dark:text-neutral-300 dark:hover:bg-slate-700',
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 text-slate-500 dark:bg-slate-700 dark:text-neutral-400">
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
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-neutral-500">
          Tips
        </h3>
        <ul className="space-y-1.5 text-sm text-slate-500 dark:text-neutral-400">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400 dark:text-neutral-500">•</span>
            <span>Type to search tabs, bookmarks, and history</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400 dark:text-neutral-500">•</span>
            <span>Enter a URL to navigate directly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400 dark:text-neutral-500">•</span>
            <span>
              <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-sans text-xs dark:border-slate-600 dark:bg-slate-700">
                {platformModifier}
              </kbd>
              <span className="mx-1">+</span>
              <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-sans text-xs dark:border-slate-600 dark:bg-slate-700">
                Enter
              </kbd>
              <span className="ml-1">to open in new tab</span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-stone-400 dark:text-neutral-500">•</span>
            <span>
              <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-sans text-xs dark:border-slate-600 dark:bg-slate-700">
                Shift
              </kbd>
              <span className="mx-1">+</span>
              <kbd className="rounded border border-stone-200 bg-stone-100 px-1 py-0.5 font-sans text-xs dark:border-slate-600 dark:bg-slate-700">
                Enter
              </kbd>
              <span className="ml-1">to open in new window</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
