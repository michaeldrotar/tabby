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
  Kbd,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  ExternalLinkIcon,
  KbdGroup,
  CmdIcon,
  ShiftIcon,
} from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type {
  ThemeAccentPalette,
  ThemeNeutralPalette,
} from '@extension/storage/lib/base/types.js'

const queryClient = new QueryClient()

const OptionsContent = () => {
  const {
    theme,
    themeLightBackground,
    themeLightForeground,
    themeLightAccent,
    themeLightAccentStrength,
    themeDarkBackground,
    themeDarkForeground,
    themeDarkAccent,
    themeDarkAccentStrength,
    tabManagerCompactIconMode,
    tabManagerCompactLayout,
  } = usePreferenceStorage()
  const { data: { os } = {} } = usePlatformInfo()

  const activeThemeMode: 'light' | 'dark' = (() => {
    if (theme === 'light' || theme === 'dark') return theme
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    return mediaQuery?.matches ? 'dark' : 'light'
  })()

  const activeThemeBackground =
    activeThemeMode === 'light' ? themeLightBackground : themeDarkBackground
  const activeThemeForeground =
    activeThemeMode === 'light' ? themeLightForeground : themeDarkForeground
  const activeThemeAccent =
    activeThemeMode === 'light' ? themeLightAccent : themeDarkAccent

  const activeThemeAccentStrength =
    activeThemeMode === 'light'
      ? themeLightAccentStrength
      : themeDarkAccentStrength

  const neutralPalettes: readonly ThemeNeutralPalette[] = [
    'slate',
    'gray',
    'zinc',
    'neutral',
    'stone',
  ]

  const accentPalettes: readonly ThemeAccentPalette[] = [
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'rose',
  ]

  const neutralSwatchByPalette = {
    slate: 'bg-slate-500',
    gray: 'bg-gray-500',
    zinc: 'bg-zinc-500',
    neutral: 'bg-neutral-500',
    stone: 'bg-stone-500',
  } satisfies Record<ThemeNeutralPalette, string>

  const accentSwatchByPalette = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
  } satisfies Record<ThemeAccentPalette, string>

  const pickRandomDifferent = <T extends string>(
    current: T,
    options: readonly T[],
  ): T => {
    if (options.length <= 1) return current
    let next = current
    while (next === current) {
      next = options[Math.floor(Math.random() * options.length)]
    }
    return next
  }

  const randomizeColors = () => {
    void preferenceStorage.set((prev) => {
      const currentBackground =
        activeThemeMode === 'light'
          ? prev.themeLightBackground
          : prev.themeDarkBackground
      const currentForeground =
        activeThemeMode === 'light'
          ? prev.themeLightForeground
          : prev.themeDarkForeground
      const currentAccent =
        activeThemeMode === 'light'
          ? prev.themeLightAccent
          : prev.themeDarkAccent

      const nextBackground = pickRandomDifferent(
        currentBackground,
        neutralPalettes,
      )
      const nextForeground = pickRandomDifferent(
        currentForeground,
        neutralPalettes,
      )
      const nextAccent = pickRandomDifferent(currentAccent, accentPalettes)

      const strengthOptions = [10, 15, 20, 25, 30, 35, 40, 45, 50] as const

      const currentAccentStrength =
        activeThemeMode === 'light'
          ? prev.themeLightAccentStrength
          : prev.themeDarkAccentStrength
      const nextAccentStrength = pickRandomDifferent(
        String(currentAccentStrength),
        strengthOptions.map(String),
      )

      return {
        ...prev,
        ...(activeThemeMode === 'light'
          ? {
              themeLightBackground: nextBackground,
              themeLightForeground: nextForeground,
              themeLightAccent: nextAccent,
              themeLightAccentStrength: Number(nextAccentStrength),
            }
          : {
              themeDarkBackground: nextBackground,
              themeDarkForeground: nextForeground,
              themeDarkAccent: nextAccent,
              themeDarkAccentStrength: Number(nextAccentStrength),
            }),
      }
    })
  }

  const openShortcutsSettings = () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
  }

  const openSidePanelSettings = () => {
    chrome.tabs.create({ url: 'chrome://settings/appearance' })
  }

  const resetPreferences = () => {
    chrome.storage.local.remove('preference-storage-key')
  }

  return (
    <div className={cn('min-h-screen w-full', 'bg-background text-foreground')}>
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
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
          <p className="text-muted">Your friendly tab manager for Chrome</p>
        </div>

        {/* Theme Section */}
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Appearance
          </h2>
          <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
            <div
              className={`
                flex flex-col gap-4
                sm:flex-row sm:items-center sm:justify-between
              `}
            >
              <div>
                <h3 className="font-medium text-foreground">Theme</h3>
                <p className="text-sm text-muted">
                  Match your system appearance, or override it
                </p>
              </div>
              <fieldset className="flex shrink-0 items-center gap-2">
                <legend className="sr-only">Theme mode</legend>
                {(
                  [
                    { value: 'system' as const, label: 'System' },
                    { value: 'light' as const, label: 'Light' },
                    { value: 'dark' as const, label: 'Dark' },
                  ] as const
                ).map((option) => {
                  return (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="theme-mode"
                        className="peer sr-only"
                        checked={theme === option.value}
                        onChange={() =>
                          preferenceStorage.set((prev) => ({
                            ...prev,
                            theme: option.value,
                          }))
                        }
                      />
                      <span
                        className={cn(
                          `
                            inline-flex rounded-lg bg-input px-3 py-2 text-sm
                            font-medium text-foreground transition-colors
                            hover:bg-input/70
                            peer-checked:bg-accent/[calc(var(--accent-strength)*1%)]
                            peer-checked:text-foreground
                            peer-checked:hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                            peer-focus-visible:ring-2
                            peer-focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                            peer-focus-visible:ring-offset-2
                            peer-focus-visible:ring-offset-background
                          `,
                        )}
                      >
                        {option.label}
                      </span>
                    </label>
                  )
                })}
              </fieldset>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground">Colors</h3>
                  <p className="text-sm text-muted">
                    Controls Tabby’s neutral palettes and accent across the UI
                  </p>
                </div>
                <button
                  type="button"
                  onClick={randomizeColors}
                  className={cn(
                    `
                      flex-shrink-0 rounded-lg bg-input px-3 py-2 text-sm
                      font-medium text-foreground transition-colors
                      hover:bg-input/70
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                      focus-visible:ring-offset-2
                      focus-visible:ring-offset-background
                    `,
                  )}
                >
                  Randomize colors
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div
                  className={`
                    grid gap-4
                    sm:grid-cols-3
                  `}
                >
                  <fieldset className="min-w-0">
                    <legend className="mb-2 text-sm font-medium text-foreground">
                      Background
                    </legend>
                    <Select
                      value={activeThemeBackground}
                      onValueChange={(value) =>
                        preferenceStorage.set((prev) => ({
                          ...prev,
                          ...(activeThemeMode === 'light'
                            ? {
                                themeLightBackground:
                                  value as ThemeNeutralPalette,
                              }
                            : {
                                themeDarkBackground:
                                  value as ThemeNeutralPalette,
                              }),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select background" />
                      </SelectTrigger>
                      <SelectContent>
                        {neutralPalettes.map((palette) => {
                          return (
                            <SelectItem key={palette} value={palette}>
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'h-3.5 w-3.5 rounded-sm',
                                    neutralSwatchByPalette[palette],
                                  )}
                                />
                                <span className="capitalize">{palette}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </fieldset>

                  <fieldset className="min-w-0">
                    <legend className="mb-2 text-sm font-medium text-foreground">
                      Foreground
                    </legend>
                    <Select
                      value={activeThemeForeground}
                      onValueChange={(value) =>
                        preferenceStorage.set((prev) => ({
                          ...prev,
                          ...(activeThemeMode === 'light'
                            ? {
                                themeLightForeground:
                                  value as ThemeNeutralPalette,
                              }
                            : {
                                themeDarkForeground:
                                  value as ThemeNeutralPalette,
                              }),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select foreground" />
                      </SelectTrigger>
                      <SelectContent>
                        {neutralPalettes.map((palette) => {
                          return (
                            <SelectItem key={palette} value={palette}>
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'h-3.5 w-3.5 rounded-sm',
                                    neutralSwatchByPalette[palette],
                                  )}
                                />
                                <span className="capitalize">{palette}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </fieldset>

                  <fieldset className="min-w-0">
                    <legend className="mb-2 text-sm font-medium text-foreground">
                      Accent
                    </legend>
                    <Select
                      value={activeThemeAccent}
                      onValueChange={(value) =>
                        preferenceStorage.set((prev) => ({
                          ...prev,
                          ...(activeThemeMode === 'light'
                            ? { themeLightAccent: value as ThemeAccentPalette }
                            : { themeDarkAccent: value as ThemeAccentPalette }),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select accent" />
                      </SelectTrigger>
                      <SelectContent>
                        {accentPalettes.map((palette) => {
                          return (
                            <SelectItem key={palette} value={palette}>
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'h-3.5 w-3.5 rounded-sm',
                                    accentSwatchByPalette[palette],
                                  )}
                                />
                                <span className="capitalize">{palette}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </fieldset>

                  <fieldset
                    className={`
                      min-w-0
                      sm:col-span-3
                    `}
                  >
                    <legend className="mb-2 text-sm font-medium text-foreground">
                      Accent strength
                    </legend>
                    <div className="flex items-center gap-4">
                      <Slider
                        aria-label="Accent strength"
                        value={[activeThemeAccentStrength]}
                        min={10}
                        max={50}
                        step={5}
                        onValueChange={(value) =>
                          preferenceStorage.set((prev) => ({
                            ...prev,
                            ...(activeThemeMode === 'light'
                              ? {
                                  themeLightAccentStrength:
                                    value[0] ?? prev.themeLightAccentStrength,
                                }
                              : {
                                  themeDarkAccentStrength:
                                    value[0] ?? prev.themeDarkAccentStrength,
                                }),
                          }))
                        }
                        className="flex-1"
                      />
                      <span
                        className={`
                          w-12 shrink-0 text-right text-sm tabular-nums
                          text-muted
                        `}
                      >
                        {activeThemeAccentStrength}%
                      </span>
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Manager Section */}
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Tab Manager
          </h2>
          <div
            className={cn(
              'flex flex-col gap-4 rounded-lg border p-4',
              'border-border bg-card',
            )}
          >
            <div
              className={`
                flex flex-col gap-3
                sm:flex-row sm:items-center sm:justify-between
              `}
            >
              <div>
                <h3 className="font-medium text-foreground">Window Icon</h3>
                <p className="text-sm text-muted">
                  Choose which tab icon to display for windows
                </p>
              </div>
              <div
                className={`
                  flex gap-2
                  sm:justify-end
                `}
              >
                <Select
                  value={tabManagerCompactIconMode}
                  onValueChange={(value) =>
                    preferenceStorage.set((prev) => ({
                      ...prev,
                      tabManagerCompactIconMode: value as 'active' | 'first',
                    }))
                  }
                >
                  <SelectTrigger
                    className={`
                      w-full
                      sm:w-[160px]
                    `}
                  >
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Tab</SelectItem>
                    <SelectItem value="first">First Tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className={`
                flex flex-col gap-3 border-t border-border pt-4
                sm:flex-row sm:items-center sm:justify-between
              `}
            >
              <div>
                <h3 className="font-medium text-foreground">Sidebar Layout</h3>
                <p className="text-sm text-muted">
                  Toggle between collapsed (icon only) and expanded (list) views
                </p>
              </div>
              <div className="flex items-center">
                <label
                  className={`relative inline-flex cursor-pointer items-center`}
                >
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
                  <div
                    className={`
                      peer h-6 w-11 rounded-full border border-border bg-input
                      after:absolute after:left-[2px] after:top-[2px] after:h-5
                      after:w-5 after:rounded-full after:border
                      after:border-border after:bg-background
                      after:transition-all after:content-['']
                      peer-checked:bg-accent/[calc(var(--accent-strength)*1%)]
                      peer-checked:after:translate-x-full
                      peer-checked:after:border-accent/[calc(var(--accent-strength)*1%)]
                      peer-checked:hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                      peer-checked:hover:after:border-accent/[calc((var(--accent-strength)+5)*1%)]
                      peer-focus-visible:outline-none peer-focus-visible:ring-4
                      peer-focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                    `}
                  ></div>
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
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
            <div
              className={`
                flex flex-col gap-3
                sm:flex-row sm:items-start sm:justify-between
              `}
            >
              <p className="text-sm text-muted">
                Configure keyboard shortcuts to quickly access Tabby's features.
              </p>
              <button
                onClick={openShortcutsSettings}
                className={cn(
                  `
                    flex shrink-0 items-center gap-2 whitespace-nowrap
                    rounded-lg bg-accent/[calc(var(--accent-strength)*1%)] px-4
                    py-2 text-sm font-medium text-foreground transition-colors
                    hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                  `,
                )}
              >
                <ExternalLinkIcon className="h-4 w-4" />
                Open Shortcut Settings
              </button>
            </div>
            <div className={cn('mt-4 rounded-md p-4', 'bg-input/40')}>
              <h4 className="mb-3 text-sm font-medium text-foreground">
                Recommended Shortcuts
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  {os === 'mac' && (
                    <KbdGroup>
                      <Kbd>
                        <CmdIcon />E
                      </Kbd>
                    </KbdGroup>
                  )}
                  {os !== 'mac' && (
                    <KbdGroup>
                      <Kbd>Alt+E</Kbd>
                    </KbdGroup>
                  )}
                  <span className="text-muted">
                    <strong className="text-foreground">Open Omnibar</strong> —
                    Quick access to search tabs, bookmarks, and history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {os === 'mac' && (
                    <KbdGroup>
                      <Kbd>
                        <CmdIcon />K
                      </Kbd>
                    </KbdGroup>
                  )}
                  {os !== 'mac' && (
                    <KbdGroup>
                      <Kbd>Alt+K</Kbd>
                    </KbdGroup>
                  )}
                  <span className="text-muted">
                    <strong className="text-foreground">
                      Open Omnibar Popup
                    </strong>{' '}
                    — Opens in a popup window instead of in-page overlay
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  {os === 'mac' && (
                    <KbdGroup>
                      <Kbd>
                        <CmdIcon />
                        <ShiftIcon />E
                      </Kbd>
                    </KbdGroup>
                  )}
                  {os !== 'mac' && (
                    <KbdGroup>
                      <Kbd>Alt+Shift+E</Kbd>
                    </KbdGroup>
                  )}
                  <span className="text-muted">
                    <strong className="text-foreground">
                      Open Tab Manager
                    </strong>{' '}
                    — Opens the side panel
                  </span>
                </li>
              </ul>
              {os !== 'mac' && (
                <p className="mt-3 text-xs text-muted">
                  Note: Chrome reserves Ctrl+E and Ctrl+K for the address bar,
                  so Alt-based shortcuts are used instead.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Side Panel Settings Section */}
        <section className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Side Panel Position
          </h2>
          <div className={cn('rounded-lg border p-4', 'border-border bg-card')}>
            <div
              className={`
                flex flex-col gap-3
                sm:flex-row sm:items-start sm:justify-between
              `}
            >
              <p className="text-sm text-muted">
                Move the Tab Manager between the left and right sides of your
                browser.
              </p>
              <button
                onClick={openSidePanelSettings}
                className={cn(
                  `
                    flex shrink-0 items-center gap-2 whitespace-nowrap
                    rounded-lg bg-accent/[calc(var(--accent-strength)*1%)] px-4
                    py-2 text-sm font-medium text-foreground transition-colors
                    hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                  `,
                )}
              >
                <ExternalLinkIcon className="h-4 w-4" />
                Open Appearance Settings
              </button>
            </div>
            <div className={cn('mt-4 rounded-md p-4', 'bg-input/40')}>
              <h4 className="mb-2 text-sm font-medium text-foreground">
                How to change the side panel position:
              </h4>
              <ol
                className={`
                  list-inside list-decimal space-y-2 text-sm text-muted
                `}
              >
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

        {/* Reset Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Reset</h2>
          <div
            className={cn(
              `
                rounded-lg border
                border-accent/[calc(var(--accent-strength)*1%)]
                bg-accent/[calc(var(--accent-strength)*1%)] p-4
              `,
            )}
          >
            <div
              className={`
                flex flex-col gap-3
                sm:flex-row sm:items-start sm:justify-between
              `}
            >
              <div>
                <h3 className="font-medium text-foreground">Preferences</h3>
                <p className="text-sm text-foreground/70">
                  Restores default settings for Tabby.
                </p>
              </div>
              <button
                type="button"
                onClick={resetPreferences}
                className={cn(
                  `
                    shrink-0 whitespace-nowrap rounded-lg
                    bg-accent/[calc(var(--accent-strength)*1%)] px-4 py-2
                    text-sm font-medium text-foreground transition-colors
                    hover:bg-accent/[calc((var(--accent-strength)+5)*1%)]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-accent/[calc(var(--accent-strength)*1%)]
                    focus-visible:ring-offset-2
                    focus-visible:ring-offset-background
                  `,
                )}
              >
                Reset preferences
              </button>
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
