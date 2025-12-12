import '@src/Options.css'
import { usePlatformInfo } from '@extension/chrome'
import {
  usePreferenceStorage,
  useThemeApplicator,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared'
import { preferenceStorage } from '@extension/storage'
import {
  cn,
  ErrorDisplay,
  LoadingSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SunIcon,
  MoonIcon,
  ExternalLinkIcon,
} from '@extension/ui'
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
    <div className={cn('min-h-screen w-full bg-background text-foreground')}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <img
              src={chrome.runtime.getURL('tabby-face.png')}
              className="h-12 w-12"
              alt="Tabby logo"
            />
            <h1 className={cn('text-3xl font-bold text-foreground')}>
              Tabby
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your friendly tab manager for Chrome
          </p>
        </div>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Appearance
          </h2>
          <div
            className={cn(
              'rounded-2xl border border-border/60 bg-surface p-4 shadow-surface',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">
                  Theme
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={preferenceStorage.toggleTheme}
                className={cn(
                  'flex items-center gap-2 rounded-lg bg-surface-muted px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface',
                )}
              >
                {theme === 'light' ? (
                  <>
                    <SunIcon className="h-5 w-5" />
                    Light
                  </>
                ) : (
                  <>
                    <MoonIcon className="h-5 w-5" />
                    Dark
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Tab Manager Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Tab Manager
          </h2>
          <div
            className={cn(
              'flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-4 shadow-surface',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">
                  Window Icon
                </h3>
                <p className="text-sm text-muted-foreground">
                  Choose which tab icon to display for windows
                </p>
              </div>
              <div className="flex gap-2">
                <Select
                  value={tabManagerCompactIconMode}
                  onValueChange={(value) =>
                    preferenceStorage.set((prev) => ({
                      ...prev,
                      tabManagerCompactIconMode: value as 'active' | 'first',
                    }))
                  }
                >
                  <SelectTrigger className="w-[140px] border-border/60 bg-surface-muted text-foreground">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Tab</SelectItem>
                    <SelectItem value="first">First Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <div>
                <h3 className="font-medium text-foreground">
                  Sidebar Layout
                </h3>
                <p className="text-sm text-muted-foreground">
                  Toggle between collapsed (icon only) and expanded (list) views
                </p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={tabManagerCompactLayout === 'list'}
                    onChange={(e) =>
                      preferenceStorage.set((prev) => ({
                        ...prev,
                        tabManagerCompactLayout: e.target.checked
                          ? 'list'
                          : 'icon',
                      }))
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-surface-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border/60 after:bg-surface after:transition-all after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-full peer-checked:after:border-accent/40 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/30"></div>
                  <span className="ml-3 text-sm font-medium text-foreground">
                    {tabManagerCompactLayout === 'list'
                      ? 'Expanded'
                      : 'Collapsed'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <div
            className={cn(
              'rounded-2xl border border-border/60 bg-surface p-4 shadow-surface',
            )}
          >
            <p className="mb-4 text-sm text-muted-foreground">
              Configure keyboard shortcuts to quickly access Tabby's features.
            </p>
            <button
              onClick={openShortcutsSettings}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground transition-colors hover:bg-accent/90',
              )}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open Shortcut Settings
            </button>
            <div
              className={cn('rounded-xl bg-surface-muted p-4')}
            >
              <h4 className="mb-3 text-sm font-medium text-foreground">
                Recommended Shortcuts
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-surface text-foreground',
                    )}
                  >
                    {isMac ? '⌘E' : 'Alt+E'}
                  </kbd>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Open Omnibar
                    </strong>{' '}
                    — Quick access to search tabs, bookmarks, and history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-surface text-foreground',
                    )}
                  >
                    {isMac ? '⌘K' : 'Alt+K'}
                  </kbd>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Open Omnibar Popup
                    </strong>{' '}
                    — Opens in a popup window instead of in-page overlay
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-surface text-foreground',
                    )}
                  >
                    {isMac ? '⌘⇧E' : 'Alt+Shift+E'}
                  </kbd>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">
                      Open Tab Manager
                    </strong>{' '}
                    — Opens the side panel
                  </span>
                </li>
              </ul>
              {!isMac && (
                <p className="mt-3 text-xs text-muted-foreground/80">
                  Note: Chrome reserves Ctrl+E and Ctrl+K for the address bar,
                  so Alt-based shortcuts are used instead.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Side Panel Settings Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Side Panel Position
          </h2>
          <div
            className={cn(
              'rounded-2xl border border-border/60 bg-surface p-4 shadow-surface',
            )}
          >
            <p className="mb-4 text-sm text-muted-foreground">
              Move the Tab Manager between the left and right sides of your
              browser.
            </p>
            <button
              onClick={openSidePanelSettings}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground transition-colors hover:bg-accent/90',
              )}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open Appearance Settings
            </button>
            <div
              className={cn('rounded-xl bg-surface-muted p-4')}
            >
              <h4 className="mb-2 text-sm font-medium text-foreground">
                How to change the side panel position:
              </h4>
              <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                <li>Scroll down to the "Side panel" section</li>
                <li>
                  Choose{' '}
                  <strong className="text-foreground">
                    "Show on left side"
                  </strong>{' '}
                  or{' '}
                  <strong className="text-foreground">
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
