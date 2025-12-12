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
    <div className={cn('min-h-screen w-full', 'bg-background text-foreground')}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <img
              src={chrome.runtime.getURL('tabby-face.png')}
              className="h-12 w-12"
              alt="Tabby logo"
            />
            <h1 className={cn('text-3xl font-bold', 'text-foreground')}>
              Tabby
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your friendly tab manager for Chrome
          </p>
        </div>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Appearance
          </h2>
          <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground font-medium">Theme</h3>
                <p className="text-muted-foreground text-sm">
                  Choose between light and dark mode
                </p>
              </div>
              <button
                onClick={preferenceStorage.toggleTheme}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                  'bg-muted text-foreground hover:bg-muted/70',
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
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Tab Manager
          </h2>
          <div
            className={cn(
              'flex flex-col gap-4 rounded-lg border p-4',
              'border-border bg-card',
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-foreground font-medium">Window Icon</h3>
                <p className="text-muted-foreground text-sm">
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
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Tab</SelectItem>
                    <SelectItem value="first">First Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-border flex items-center justify-between border-t pt-4">
              <div>
                <h3 className="text-foreground font-medium">Sidebar Layout</h3>
                <p className="text-muted-foreground text-sm">
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
                  <div className="border-border bg-muted after:border-border after:bg-background peer-checked:bg-primary peer-checked:after:border-primary-foreground peer-focus:ring-ring/30 peer h-6 w-11 rounded-full border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4"></div>
                  <span className="text-foreground ml-3 text-sm font-medium">
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
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Keyboard Shortcuts
          </h2>
          <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
            <p className="text-muted-foreground mb-4 text-sm">
              Configure keyboard shortcuts to quickly access Tabby's features.
            </p>
            <button
              onClick={openShortcutsSettings}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open Shortcut Settings
            </button>
            <div className={cn('rounded-md p-4', 'bg-muted/40')}>
              <h4 className="text-foreground mb-3 text-sm font-medium">
                Recommended Shortcuts
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-muted text-muted-foreground',
                    )}
                  >
                    {isMac ? '⌘E' : 'Alt+E'}
                  </kbd>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Open Omnibar</strong> —
                    Quick access to search tabs, bookmarks, and history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <kbd
                    className={cn(
                      'inline-flex shrink-0 items-center rounded px-2 py-1 font-mono text-xs',
                      'bg-muted text-muted-foreground',
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
                      'bg-muted text-muted-foreground',
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
                <p className="text-muted-foreground mt-3 text-xs">
                  Note: Chrome reserves Ctrl+E and Ctrl+K for the address bar,
                  so Alt-based shortcuts are used instead.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Side Panel Settings Section */}
        <section className="mb-8">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Side Panel Position
          </h2>
          <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
            <p className="text-muted-foreground mb-4 text-sm">
              Move the Tab Manager between the left and right sides of your
              browser.
            </p>
            <button
              onClick={openSidePanelSettings}
              className={cn(
                'mb-4 flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Open Appearance Settings
            </button>
            <div className={cn('rounded-md p-4', 'bg-muted/40')}>
              <h4 className="text-foreground mb-2 text-sm font-medium">
                How to change the side panel position:
              </h4>
              <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
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
