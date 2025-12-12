import '@src/Options.css'
import { usePlatformInfo } from '@extension/chrome'
import {
  usePreferenceStorage,
  useThemeApplicator,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared'
import { preferenceStorage } from '@extension/storage'
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const OptionsContent = () => {
  const { theme, tabManagerCompactIconMode, tabManagerCompactLayout } =
    usePreferenceStorage()
  const { data: platformInfo } = usePlatformInfo()
  const isMac = platformInfo?.os === 'mac'

  const openShortcutsSettings = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }

  const openSidePanelSettings = () => {
    chrome.tabs.create({ url: 'chrome://settings/appearance' })
  }

  return (
    <div
      className={cn(
        'min-h-screen w-full',
        'bg-slate-50 text-gray-900',
        'dark:bg-gray-900 dark:text-gray-100',
      )}
    >
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <img
              src={chrome.runtime.getURL('tabby-face.png')}
              className="h-12 w-12"
              alt="Tabby logo"
            />
            <h1
              className={cn(
                'text-3xl font-bold',
                'text-gray-800 dark:text-gray-100',
              )}
            >
              Tabby
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your friendly tab manager for Chrome
          </p>
        </div>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Appearance
          </h2>
          <div
            className={cn(
              'rounded-lg border p-4',
              'border-gray-200 bg-white',
              'dark:border-gray-700 dark:bg-gray-800',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Theme
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={preferenceStorage.toggleTheme}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                  'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  'dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                )}
              >
                {theme === 'light' ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8 1.8-1.8zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.24-2.16l1.79 1.79 1.79-1.79-1.79-1.8-1.79 1.8zM20 11v2h3v-2h-3zM11 1h2v3h-2V1zm4.24 3.76l1.79-1.8-1.79-1.79-1.8 1.79 1.8 1.8zM12 6a6 6 0 100 12 6 6 0 000-12z" />
                    </svg>
                    Light
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="currentColor"
                    >
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                    Dark
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Tab Manager Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Tab Manager
          </h2>
          <div
            className={cn(
              'flex flex-col gap-4 rounded-lg border p-4',
              'border-gray-200 bg-white',
              'dark:border-gray-700 dark:bg-gray-800',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Compact View Icon
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose which tab icon to display
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    preferenceStorage.set((prev) => ({
                      ...prev,
                      tabManagerCompactIconMode: 'active',
                    }))
                  }
                  className={cn(
                    'rounded-lg px-4 py-2 font-medium transition-colors',
                    tabManagerCompactIconMode === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                  )}
                >
                  Active Tab
                </button>
                <button
                  onClick={() =>
                    preferenceStorage.set((prev) => ({
                      ...prev,
                      tabManagerCompactIconMode: 'first',
                    }))
                  }
                  className={cn(
                    'rounded-lg px-4 py-2 font-medium transition-colors',
                    tabManagerCompactIconMode === 'first'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                  )}
                >
                  First Tab
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  Compact View Layout
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose layout style
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    preferenceStorage.set((prev) => ({
                      ...prev,
                      tabManagerCompactLayout: 'icon',
                    }))
                  }
                  className={cn(
                    'rounded-lg px-4 py-2 font-medium transition-colors',
                    tabManagerCompactLayout === 'icon'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                  )}
                >
                  Icon Only
                </button>
                <button
                  onClick={() =>
                    preferenceStorage.set((prev) => ({
                      ...prev,
                      tabManagerCompactLayout: 'list',
                    }))
                  }
                  className={cn(
                    'rounded-lg px-4 py-2 font-medium transition-colors',
                    tabManagerCompactLayout === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                  )}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Keyboard Shortcuts
          </h2>
          <div
            className={cn(
              'rounded-lg border p-4',
              'border-gray-200 bg-white',
              'dark:border-gray-700 dark:bg-gray-800',
            )}
          >
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Configure keyboard shortcuts to quickly access Tabby's features.
            </p>
            <button
              onClick={openShortcutsSettings}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open Shortcut Settings
            </button>
            <div
              className={cn('rounded-md p-4', 'bg-gray-50 dark:bg-gray-900')}
            >
              <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Recommended Shortcuts
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-gray-200 text-gray-700',
                      'dark:bg-gray-700 dark:text-gray-300',
                    )}
                  >
                    {isMac ? '⌘E' : 'Alt+E'}
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-800 dark:text-gray-200">
                      Open Omnibar
                    </strong>{' '}
                    — Quick access to search tabs, bookmarks, and history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-gray-200 text-gray-700',
                      'dark:bg-gray-700 dark:text-gray-300',
                    )}
                  >
                    {isMac ? '⌘K' : 'Alt+K'}
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-800 dark:text-gray-200">
                      Open Omnibar Popup
                    </strong>{' '}
                    — Opens in a popup window instead of in-page overlay
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-gray-200 text-gray-700',
                      'dark:bg-gray-700 dark:text-gray-300',
                    )}
                  >
                    {isMac ? '⌘⇧E' : 'Alt+Shift+E'}
                  </kbd>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-800 dark:text-gray-200">
                      Open Tab Manager
                    </strong>{' '}
                    — Opens the side panel
                  </span>
                </li>
              </ul>
              {!isMac && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                  Note: Chrome reserves Ctrl+E and Ctrl+K for the address bar,
                  so Alt-based shortcuts are used instead.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Side Panel Settings Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
            Side Panel Position
          </h2>
          <div
            className={cn(
              'rounded-lg border p-4',
              'border-gray-200 bg-white',
              'dark:border-gray-700 dark:bg-gray-800',
            )}
          >
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Move the Tab Manager between the left and right sides of your
              browser.
            </p>
            <button
              onClick={openSidePanelSettings}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open Appearance Settings
            </button>
            <div
              className={cn('rounded-md p-4', 'bg-gray-50 dark:bg-gray-900')}
            >
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                How to change the side panel position:
              </h4>
              <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Scroll down to the "Side panel" section</li>
                <li>
                  Choose{' '}
                  <strong className="text-gray-800 dark:text-gray-200">
                    "Show on left side"
                  </strong>{' '}
                  or{' '}
                  <strong className="text-gray-800 dark:text-gray-200">
                    "Show on right side"
                  </strong>
                </li>
                <li>The Tab Manager will move to your chosen side</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const Options = () => {
  useThemeApplicator()

  return (
    <QueryClientProvider client={queryClient}>
      <OptionsContent />
    </QueryClientProvider>
  )
}

export default withErrorBoundary(
  withSuspense(Options, <LoadingSpinner />),
  ErrorDisplay,
)
