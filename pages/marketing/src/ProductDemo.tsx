import {
  OmnibarExperience,
  OptionsExperience,
  TabbySurface,
  TabManagerExperience,
  useTabbyPreferences,
  useTabbyResources,
} from '@extension/app'
import { MemoryTabbyProvider } from '@extension/providers/memory'
import { ThemePalette } from '@extension/ui/options/ThemePalette'
import { useState } from 'react'
import { createMarketingDemo, searchExamples } from './demo'
import { useMarketingAppearance } from './MarketingAppearance'
import { marketingThemes } from './marketingThemes'

const AppearanceControls = ({ labelled }: { labelled: boolean }) => {
  const { preferences } = useTabbyResources()
  const appearance = useTabbyPreferences()
  return (
    <div className="appearance-controls">
      {labelled && <span className="demo-control-label">Demo themes</span>}
      <button
        type="button"
        className="demo-theme-toggle"
        role="switch"
        aria-checked={appearance.theme === 'dark'}
        aria-label="Dark mode"
        onClick={() =>
          void preferences.set({
            theme: appearance.theme === 'dark' ? 'light' : 'dark',
          })
        }
      >
        <span className="demo-theme-track" aria-hidden="true">
          <span className="demo-theme-thumb">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {appearance.theme === 'dark' ? (
                <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                </>
              )}
            </svg>
          </span>
        </span>
        <span>Dark mode</span>
      </button>
      <div className="demo-theme-choices" role="group" aria-label="Demo themes">
        {marketingThemes.map((theme) => (
          <button
            type="button"
            className="demo-theme-choice"
            key={theme.id}
            aria-label={`${theme.name} theme`}
            title={theme.name}
            aria-pressed={appearance.themePreset === theme.id}
            onClick={() => void preferences.set({ themePreset: theme.id })}
          >
            <ThemePalette
              colors={theme[appearance.theme === 'dark' ? 'dark' : 'light']}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export type ProductDemoProps = {
  theme?: 'light' | 'dark'
  initialExperience?: 'manager' | 'search'
  separated?: boolean
}

export const ProductDemo = ({
  theme = 'light',
  initialExperience = 'manager',
  separated = false,
}: ProductDemoProps) => {
  const preferences = useMarketingAppearance()
  const [demo] = useState(() => createMarketingDemo(theme, preferences))
  const [experience, setExperience] = useState<
    'manager' | 'search' | 'options'
  >(initialExperience)
  const [notice, setNotice] = useState('')
  const shownExperience = experience
  const explore = (next: typeof experience) => {
    setExperience(next)
    setNotice('')
  }
  const reset = () => {
    demo.restore(demo.initial)
    explore(initialExperience)
  }
  return (
    <div
      className={['product-demo', separated && 'product-demo--separated']
        .filter(Boolean)
        .join(' ')}
      data-demo
    >
      <MemoryTabbyProvider
        resources={{ backend: demo.backend, preferences: demo.preferences }}
        views={demo.views}
        optionsMetadata={{
          logoUrl: new URL('/tabby-face-128.png', window.location.origin).href,
        }}
        optionsHost={{
          openShortcutsSettings: async () =>
            setNotice('Customize Chrome shortcuts after installing Tabby.'),
          openSidePanelSettings: async () =>
            setNotice(
              'Choose your side panel position in Chrome after installing Tabby.',
            ),
        }}
        omnibar={{
          results: searchExamples,
          onTabManager: () => explore('manager'),
          onOptions: () => explore('options'),
        }}
        host={{
          openSearch: () => explore('search'),
          openOptions: () => explore('options'),
          writeClipboardText: async (text) => {
            await navigator.clipboard.writeText(text)
            setNotice('Sample links copied to your clipboard.')
          },
        }}
      >
        <div className="demo-bar">
          <div className="demo-views" role="group" aria-label="Demo experience">
            <button
              type="button"
              aria-pressed={shownExperience === 'manager'}
              onClick={() => explore('manager')}
            >
              Tabs
            </button>
            <button
              type="button"
              aria-pressed={shownExperience === 'search'}
              onClick={() => explore('search')}
            >
              Search
            </button>
            <button
              type="button"
              aria-pressed={shownExperience === 'options'}
              onClick={() => explore('options')}
            >
              Options
            </button>
          </div>
          <button type="button" className="reset-demo" onClick={reset}>
            Reset
          </button>
        </div>
        <div
          className={`
            demo-screen
            demo-screen--${shownExperience}
          `}
        >
          <TabbySurface
            inputMode="live"
            motion="system"
            className="demo-surface"
          >
            {shownExperience === 'manager' ? (
              <TabManagerExperience focusOnMount={false} />
            ) : shownExperience === 'search' ? (
              <OmnibarExperience
                onDismiss={() =>
                  setNotice('Sample page opened. Try another search.')
                }
              />
            ) : (
              <OptionsExperience />
            )}
          </TabbySurface>
        </div>
        <div className="demo-tools">
          <AppearanceControls labelled={separated} />
        </div>
        <div className="demo-caption" aria-live="polite">
          {notice || 'Try the tabs, search, and themes. It’s all sample data.'}
        </div>
      </MemoryTabbyProvider>
    </div>
  )
}
