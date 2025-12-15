import {
  useThemeApplicator,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared'
import {
  cn,
  ErrorDisplay,
  Kbd,
  KbdGroup,
  LoadingSpinner,
  OmnibarDemo,
  SettingsNav,
} from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { OmnibarDemoScenarioId } from '@extension/ui'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

const FEATURES_SEEN_VERSION_KEY = 'tabby-features-seen-version'

const markFeaturesSeen = async () => {
  const version = chrome.runtime.getManifest().version
  await chrome.storage.local.set({ [FEATURES_SEEN_VERSION_KEY]: version })
  await chrome.action.setBadgeText({ text: '' })
}

type SituationId =
  | 'too-many-tabs'
  | 'lost-tab'
  | 'research-rabbit-hole'
  | 'clean-up'

type SituationContent = {
  id: SituationId
  title: string
  kicker: string
  description: string
  outcomeA: string
  outcomeB: string
  scenarioId: OmnibarDemoScenarioId
}

const getSituationContent = (id: SituationId): SituationContent => {
  switch (id) {
    case 'lost-tab':
      return {
        id,
        title: 'Lost tab',
        kicker: 'You know it’s open. You just can’t find it.',
        description:
          'Type a fuzzy memory — a word, a URL fragment, a project name — and jump straight to the tab you meant.',
        outcomeA: 'Switch to the right tab in seconds',
        outcomeB: 'No window hunting, no scrolling',
        scenarioId: 'find-open-tab',
      }
    case 'research-rabbit-hole':
      return {
        id,
        title: 'Research rabbit hole',
        kicker: 'You’ve got 40 tabs and a half-remembered phrase.',
        description:
          'Search like you think. Multi-term matching pulls results from titles and URLs, even when you’re vague.',
        outcomeA: 'Find “that doc” without perfect keywords',
        outcomeB: 'Stay in flow with keyboard selection',
        scenarioId: 'multi-term-matching',
      }
    case 'clean-up':
      return {
        id,
        title: 'Clean up',
        kicker: 'Stop breaking your current tab just to open a result.',
        description:
          'Open results in a new tab or a new window — when you want to branch — not when Chrome forces you to.',
        outcomeA: 'Open in a new tab (Cmd/Ctrl+Enter)',
        outcomeB: 'Open in a new window (Shift+Enter)',
        scenarioId: 'open-in-new-tab-window',
      }
    case 'too-many-tabs':
    default:
      return {
        id: 'too-many-tabs',
        title: 'Too many tabs',
        kicker: 'Your browser is not messy. It’s overloaded.',
        description:
          'Search across tabs, bookmarks, history, and recently closed — without switching tools or breaking context.',
        outcomeA: 'One search surface for everything',
        outcomeB: 'Less context switching, less cognitive load',
        scenarioId: 'search-everything',
      }
  }
}

type SituationButtonProps = {
  id: SituationId
  title: string
  isActive: boolean
  onClick: (id: SituationId) => void
}

const SituationButton = ({
  id,
  title,
  isActive,
  onClick,
}: SituationButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'border-border bg-background group flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left',
        'hover:bg-highlighted/40 focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        isActive
          ? 'bg-accent/[calc(var(--accent-strength)*1%)] text-foreground'
          : 'text-foreground',
      )}
      onClick={() => onClick(id)}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            'text-muted font-mono text-sm',
            isActive ? 'text-foreground/80' : undefined,
          )}
          aria-hidden
        >
          &gt;
        </span>
        <span className="font-semibold">{title}</span>
      </span>
      <span
        className={cn(
          'text-muted text-xs transition-opacity',
          isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100',
        )}
      >
        Run
      </span>
    </button>
  )
}

type CommandCardProps = {
  title: string
  description: string
  hint: ReactNode
  onClick: () => void
}

const CommandCard = ({
  title,
  description,
  hint,
  onClick,
}: CommandCardProps) => {
  return (
    <button
      type="button"
      className={cn(
        'border-border bg-card group w-full rounded-xl border p-5 text-left',
        'hover:bg-highlighted/30 focus-visible:ring-accent/[calc(var(--accent-strength)*1%)] focus-visible:ring-offset-background focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-muted text-xs font-medium uppercase tracking-wider">
            Command
          </div>
          <div className="mt-2 flex items-start gap-3">
            <span className="text-muted mt-0.5 font-mono" aria-hidden>
              &gt;
            </span>
            <div className="min-w-0">
              <div className="text-foreground text-base font-semibold leading-snug">
                {title}
              </div>
              <div className="text-muted mt-1 text-sm">{description}</div>
            </div>
          </div>
        </div>
        <div className="text-muted flex-shrink-0 text-xs">{hint}</div>
      </div>
    </button>
  )
}

type ShortcutRowProps = {
  keys: ReactNode
  label: string
  detail: string
}

const ShortcutRow = ({ keys, label, detail }: ShortcutRowProps) => {
  return (
    <div className="border-border bg-background flex items-start justify-between gap-4 rounded-lg border px-4 py-3">
      <div className="min-w-0">
        <div className="text-foreground text-sm font-semibold">{label}</div>
        <div className="text-muted mt-0.5 text-xs">{detail}</div>
      </div>
      <div className="flex-shrink-0 text-xs">{keys}</div>
    </div>
  )
}

const FeaturesContent = () => {
  const [hasNewFeatures, setHasNewFeatures] = useState(false)
  const [activeSituationId, setActiveSituationId] =
    useState<SituationId>('too-many-tabs')
  const [activeScenarioId, setActiveScenarioId] =
    useState<OmnibarDemoScenarioId>('search-everything')
  const [heroOverride, setHeroOverride] = useState<
    | {
        label: string
        note: string
      }
    | undefined
  >(undefined)

  const optionsHref = useMemo(
    () => chrome.runtime.getURL('options/index.html'),
    [],
  )
  const featuresHref = useMemo(
    () => chrome.runtime.getURL('features/index.html'),
    [],
  )

  useEffect(() => {
    const version = chrome.runtime.getManifest().version

    const sync = async () => {
      const res = await chrome.storage.local.get(FEATURES_SEEN_VERSION_KEY)
      const seenVersion = res[FEATURES_SEEN_VERSION_KEY] as string | undefined
      setHasNewFeatures(seenVersion !== version)
    }

    void sync()

    const handleChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'local') return
      if (FEATURES_SEEN_VERSION_KEY in changes) {
        const next = changes[FEATURES_SEEN_VERSION_KEY]?.newValue as
          | string
          | undefined
        setHasNewFeatures(next !== version)
      }
    }

    chrome.storage.onChanged.addListener(handleChanged)
    return () => chrome.storage.onChanged.removeListener(handleChanged)
  }, [])

  useEffect(() => {
    void markFeaturesSeen()
  }, [])

  const situation = useMemo(
    () => getSituationContent(activeSituationId),
    [activeSituationId],
  )

  const handleSelectSituation = (id: SituationId) => {
    const next = getSituationContent(id)
    setActiveSituationId(id)
    setActiveScenarioId(next.scenarioId)
    setHeroOverride(undefined)
  }

  const heroTitle = heroOverride?.label ?? situation.title
  const heroNote = heroOverride?.note

  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    const platform = navigator.platform?.toLowerCase() ?? ''
    return platform.includes('mac')
  }, [])

  return (
    <div className={cn('min-h-screen w-full', 'bg-background text-foreground')}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10">
          <div className="mb-6 flex items-center justify-center gap-3">
            <img
              src={chrome.runtime.getURL('tabby-face.png')}
              className="h-12 w-12"
              alt="Tabby logo"
            />
            <div className="text-left">
              <h1 className={cn('text-3xl font-bold', 'text-foreground')}>
                Features
              </h1>
              <p className="text-muted text-sm">
                A live command center for your browser.
              </p>
            </div>
          </div>
        </header>

        <SettingsNav
          active="features"
          optionsHref={optionsHref}
          featuresHref={featuresHref}
          hasNewFeatures={hasNewFeatures}
        />

        <section className="mt-10">
          <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <div>
                <div className="text-muted text-xs font-medium uppercase tracking-wider">
                  Command Center
                </div>
                <h2 className="text-foreground mt-2 text-4xl font-bold leading-[1.05]">
                  Your browser, under control.
                </h2>
                <p className="text-muted mt-3 text-base">
                  Find the tab you meant. Undo mistakes. Open cleanly. All from
                  one keyboard-first surface.
                </p>

                <div className="mt-7">
                  <div className="text-muted text-xs font-medium uppercase tracking-wider">
                    Choose a situation
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <SituationButton
                      id="too-many-tabs"
                      title="Too many tabs"
                      isActive={activeSituationId === 'too-many-tabs'}
                      onClick={handleSelectSituation}
                    />
                    <SituationButton
                      id="lost-tab"
                      title="Lost tab"
                      isActive={activeSituationId === 'lost-tab'}
                      onClick={handleSelectSituation}
                    />
                    <SituationButton
                      id="research-rabbit-hole"
                      title="Research rabbit hole"
                      isActive={activeSituationId === 'research-rabbit-hole'}
                      onClick={handleSelectSituation}
                    />
                    <SituationButton
                      id="clean-up"
                      title="Clean up"
                      isActive={activeSituationId === 'clean-up'}
                      onClick={handleSelectSituation}
                    />
                  </div>

                  <div className="border-border bg-background mt-4 rounded-xl border p-4">
                    <div className="text-foreground text-lg font-semibold">
                      {situation.kicker}
                    </div>
                    <div className="text-muted mt-2 text-sm">
                      {situation.description}
                    </div>
                    <div className="text-muted mt-4 grid gap-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{situation.outcomeA}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5">•</span>
                        <span>{situation.outcomeB}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-border bg-background overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <div className="text-muted text-[11px] font-medium uppercase tracking-wider">
                      Live Omnibar
                    </div>
                    <div className="text-foreground text-sm font-semibold">
                      {heroTitle}
                    </div>
                    {heroNote && (
                      <div className="text-muted mt-0.5 text-xs">
                        {heroNote}
                      </div>
                    )}
                  </div>
                  <div className="text-muted text-xs">Autoplay</div>
                </div>
                <OmnibarDemo
                  scenarioId={activeScenarioId}
                  className="h-[470px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <CommandCard
              title="Jump to the tab you meant."
              description="Fuzzy memory in. Right tab out. No scrolling through windows."
              hint={
                <KbdGroup>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <Kbd>Enter</Kbd>
                </KbdGroup>
              }
              onClick={() => handleSelectSituation('lost-tab')}
            />
            <CommandCard
              title="Recover the thing you just closed."
              description="Undo one mistake without rewinding your whole session."
              hint={<span className="font-mono">recently closed</span>}
              onClick={() => {
                setActiveScenarioId('recover-recently-closed')
                setHeroOverride({
                  label: 'Recover a closed tab',
                  note: 'Recently closed results, instant reopen.',
                })
              }}
            />
            <CommandCard
              title="Search everything without context switching."
              description="Tabs + bookmarks + history + recently closed, in one place."
              hint={
                <span className="font-mono">tabs • history • bookmarks</span>
              }
              onClick={() => handleSelectSituation('too-many-tabs')}
            />
          </div>

          <div className="border-border bg-card mt-8 rounded-2xl border p-6 md:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="text-foreground text-xl font-semibold">
                  Power user shortcuts
                </h3>
                <p className="text-muted mt-1 text-sm">
                  No menus. No mouse miles. Just muscle memory.
                </p>
              </div>
              <div className="text-muted text-xs">
                {isMac ? 'Mac' : 'Windows/Linux'}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <ShortcutRow
                label="Move selection"
                detail="Navigate results without leaving the keyboard."
                keys={
                  <KbdGroup>
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                  </KbdGroup>
                }
              />
              <ShortcutRow
                label="Open selected"
                detail="Execute the highlighted action."
                keys={<Kbd>Enter</Kbd>}
              />
              <ShortcutRow
                label="Open in new tab"
                detail="Branch without losing your current page."
                keys={
                  isMac ? (
                    <KbdGroup>
                      <Kbd>⌘</Kbd>
                      <Kbd>Enter</Kbd>
                    </KbdGroup>
                  ) : (
                    <KbdGroup>
                      <Kbd>Ctrl</Kbd>
                      <Kbd>Enter</Kbd>
                    </KbdGroup>
                  )
                }
              />
              <ShortcutRow
                label="Open in new window"
                detail="Pop a result out when it deserves its own space."
                keys={
                  <KbdGroup>
                    <Kbd>Shift</Kbd>
                    <Kbd>Enter</Kbd>
                  </KbdGroup>
                }
              />
              <ShortcutRow
                label="Close Omnibar"
                detail="Dismiss instantly."
                keys={<Kbd>Esc</Kbd>}
              />
              <ShortcutRow
                label="Type to search"
                detail="Tabs, bookmarks, history, recently closed."
                keys={<span className="font-mono">just type</span>}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

const Features = () => {
  useThemeApplicator()

  return (
    <QueryClientProvider client={queryClient}>
      <FeaturesContent />
    </QueryClientProvider>
  )
}

export default withErrorBoundary(
  withSuspense(Features, <LoadingSpinner />),
  ErrorDisplay,
)
