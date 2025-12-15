import {
  useThemeApplicator,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared'
import {
  cn,
  ErrorDisplay,
  LoadingSpinner,
  OmnibarDemo,
  omnibarDemoScenarios,
  SettingsNav,
} from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

const queryClient = new QueryClient()

const FEATURES_SEEN_VERSION_KEY = 'tabby-features-seen-version'

const markFeaturesSeen = async () => {
  const version = chrome.runtime.getManifest().version
  await chrome.storage.local.set({ [FEATURES_SEEN_VERSION_KEY]: version })
  await chrome.action.setBadgeText({ text: '' })
}

const FeaturesContent = () => {
  const [hasNewFeatures, setHasNewFeatures] = useState(false)

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
                Autoplay demos that show how Tabby helps you move faster.
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
          <div className="mb-6">
            <h2 className="text-foreground text-xl font-semibold">Omnibar</h2>
            <p className="text-muted mt-1 text-sm">
              Keyboard-first search across tabs, bookmarks, history, and more.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {omnibarDemoScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="border-border bg-card rounded-lg border p-6"
              >
                <div className="grid gap-6 md:grid-cols-2 md:items-start">
                  <div>
                    <h3 className="text-foreground text-lg font-semibold">
                      {scenario.title}
                    </h3>
                    <p className="text-muted mt-2 text-sm">
                      {scenario.description}
                    </p>
                    <ul className="text-muted mt-4 list-disc space-y-1 pl-5 text-sm">
                      <li>{scenario.bullets[0]}</li>
                      <li>{scenario.bullets[1]}</li>
                    </ul>
                  </div>

                  <div className="border-border bg-background overflow-hidden rounded-md border">
                    <OmnibarDemo
                      scenarioId={scenario.id}
                      className="h-[420px]"
                    />
                  </div>
                </div>
              </div>
            ))}
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
