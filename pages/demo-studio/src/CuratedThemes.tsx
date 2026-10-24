import './curated-themes.css'
import {
  OmnibarExperience,
  OptionsExperience,
  TabbyProvider,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { curatedThemes, themeCollections, themeTokens } from '@extension/core'
import { ThemeCard } from '@extension/ui/options/ThemeCard'
import { Surface } from '@extension/ui/Surface'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'
import logoUrl from '../../../chrome-extension/public/tabby-face-128.png?url'
import type { Scenario } from './scenario'
import type { CuratedTheme, ThemeAppearance } from '@extension/core'

const seasonalImages = import.meta.glob<string>(
  '../../../chrome-extension/public/seasonal-icons/*-128.png',
  { eager: true, query: '?url', import: 'default' },
)
const iconFor = (theme: CuratedTheme) =>
  theme.icon
    ? seasonalImages[
        `../../../chrome-extension/public/seasonal-icons/${theme.icon}-128.png`
      ]
    : logoUrl

export const CuratedThemes = ({ scenario }: { scenario: Scenario }) => {
  const resource = scenario.resources[0]!.preferences
  const preferences = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  const theme =
    curatedThemes.find((theme) => theme.id === preferences.themePreset) ??
    curatedThemes[0]!
  const mode =
    preferences.theme === 'system'
      ? scenario.resources[0]!.environment.systemTheme
      : preferences.theme
  const setTheme = (theme: (typeof curatedThemes)[number]) => {
    void resource.set({
      themePreset: theme.id,
    })
  }
  const setMode = (theme: ThemeAppearance) => {
    void resource.set({ theme })
  }
  const optionsPage =
    new URLSearchParams(location.search).get('page') === 'options'
  const [narrow, setNarrow] = useState(false)
  const navigation = useStore(scenario.navigation[0]!)
  const colors = theme[mode]
  useEffect(() => {
    scenario.controllers[0]!.dispatch({
      type: 'select-item',
      item: { type: 'tab', id: 12 },
    })
    return () => scenario.dispose()
  }, [scenario])
  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('theme', theme.id)
    url.searchParams.set('mode', preferences.theme)
    history.replaceState(null, '', url)
  }, [theme.id, preferences.theme])

  return (
    <div className="curated-page">
      <header className="curated-topbar">
        <a className="brand" href="/" aria-label="Back to Demo Studio">
          <img src={logoUrl} alt="" />
          <span className="brand-name">tabby</span>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-context">
            {optionsPage ? 'Options' : 'Theme collection'}
          </span>
        </a>
        <div className="curated-page-links">
          <a
            href={
              optionsPage
                ? `?curated-themes&theme=${theme.id}&mode=${preferences.theme}`
                : `?curated-themes&page=options&theme=${theme.id}&mode=${preferences.theme}`
            }
          >
            {optionsPage ? 'Theme collection' : 'Open options page'}
          </a>
          <a href="/">Demo Studio</a>
        </div>
      </header>
      {optionsPage ? (
        <main className="curated-options-page">
          <TabbyProvider {...scenario.providerResources[0]!}>
            <TabbySurface motion={theme.id === 'summer' ? 'system' : 'reduced'}>
              <OptionsExperience urlSeasonalIcons />
            </TabbySurface>
          </TabbyProvider>
        </main>
      ) : (
        <main className="curated-layout">
          <section
            className="curated-picker"
            aria-label="Appearance experiment"
          >
            <div className="curated-intro">
              <span className="curated-experiment">Appearance experiment</span>
              <h1>A little more you.</h1>
              <p>
                One theme brings Tabby’s colors together.
                <br />
                Choose a look and try the live preview.
              </p>
            </div>
            <fieldset className="curated-mode">
              <legend>Appearance</legend>
              <div>
                {(['light', 'dark'] as const).map((value) => (
                  <button
                    key={value}
                    aria-pressed={mode === value}
                    onClick={() => setMode(value)}
                  >
                    <span aria-hidden="true">
                      {value === 'light' ? '☀' : '☾'}
                    </span>{' '}
                    {value === 'light' ? 'Light' : 'Dark'}
                  </button>
                ))}
              </div>
            </fieldset>
            {themeCollections.map((collection) => (
              <section
                className="curated-collection"
                key={collection}
                aria-label={`${collection} themes`}
              >
                <div className="curated-collection-heading">
                  <h2>{collection}</h2>
                  <span>
                    {collection === 'Colorful'
                      ? 'Contrasting colors, composed together'
                      : collection === 'Tonal'
                        ? 'One color, many shades'
                        : 'A change of season'}
                  </span>
                </div>
                <div className="curated-grid">
                  {curatedThemes
                    .filter((t) => t.collection === collection)
                    .map((t) => (
                      <ThemeCard
                        key={t.id}
                        theme={t}
                        mode={mode}
                        selected={theme.id === t.id}
                        onSelect={() => setTheme(t)}
                      />
                    ))}
                </div>
              </section>
            ))}
            <p className="curated-footnote">
              Each theme has a light and dark version.
            </p>
          </section>
          <section className="curated-preview" aria-label="Live theme preview">
            <Surface
              theme={mode}
              tokens={themeTokens(colors)}
              className="curated-workbench"
              instanceId="curated-workbench"
            >
              <div className="curated-preview-heading">
                <img
                  src={iconFor(theme)}
                  alt={
                    theme.collection === 'Seasonal'
                      ? `${theme.name} Tabby icon`
                      : 'Tabby icon'
                  }
                />
                <div>
                  <h2>{theme.name}</h2>
                  <p>{theme.description}</p>
                </div>
              </div>
              <div className="curated-preview-tools">
                <div role="group" aria-label="Preview product">
                  {(['manager', 'omnibar', 'options'] as const).map(
                    (product) => (
                      <button
                        key={product}
                        aria-pressed={navigation.product === product}
                        onClick={() =>
                          scenario.navigation[0]!.setState({ product })
                        }
                      >
                        {product === 'manager'
                          ? 'Tabs'
                          : product === 'omnibar'
                            ? 'Search'
                            : 'Appearance'}
                      </button>
                    ),
                  )}
                </div>
                {navigation.product === 'manager' && (
                  <button
                    aria-pressed={narrow}
                    onClick={() => setNarrow(!narrow)}
                  >
                    Narrow
                  </button>
                )}
              </div>
              <div
                className="curated-stage"
                data-narrow={narrow && navigation.product === 'manager'}
              >
                <div className="curated-product">
                  <TabbyProvider {...scenario.providerResources[0]!}>
                    <TabbySurface
                      theme={mode}
                      tokens={themeTokens(colors)}
                      instanceId="curated-product"
                      motion={theme.id === 'summer' ? 'system' : 'reduced'}
                    >
                      {navigation.product === 'manager' ? (
                        <TabManagerExperience
                          controller={scenario.controllers[0]}
                        />
                      ) : navigation.product === 'omnibar' ? (
                        <OmnibarExperience
                          onDismiss={() =>
                            scenario.navigation[0]!.setState({
                              product: 'manager',
                            })
                          }
                        />
                      ) : (
                        <OptionsExperience />
                      )}
                    </TabbySurface>
                  </TabbyProvider>
                </div>
              </div>
              <div className="curated-palette" aria-label="Theme color roles">
                {(
                  [
                    ['Canvas', colors.canvas],
                    ['Chrome', colors.chrome],
                    ['Selection', colors.selection],
                    ['Accent', colors.accent],
                    ['Companion', colors.secondary],
                  ] as const
                ).map(([label, color]) => (
                  <div key={label}>
                    <i style={{ background: color }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <p className="curated-preview-note">
                Live sample tabs. Try selecting, hovering, and opening a menu.
              </p>
            </Surface>
          </section>
        </main>
      )}
    </div>
  )
}
