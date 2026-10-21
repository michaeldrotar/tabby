import './demo-studio.css'
import {
  OmnibarExperience,
  OptionsExperience,
  TabbyProvider,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { THEME_ACCENT_PALETTES, THEME_NEUTRAL_PALETTES } from '@extension/core'
import { neutralSwatchColors as neutralColors } from '@extension/ui/theme-colors'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createRoot } from 'react-dom/client'
import { useStore } from 'zustand'
import logoUrl from '../../../chrome-extension/public/tabby-face-128.png?url'
import { DemoTransport } from './DemoTransport'
import { createScenario } from './scenario'
import type { Dataset, Product, Scenario, Sharing } from './scenario'
import type { ThemeAccentPalette } from '@extension/core'
import type { SurfaceInputMode } from '@extension/ui/Surface'

type InstanceSize = 'wide' | 'narrow'
type StudioPage = 'explore' | 'guided' | 'anatomy'
type AnatomyPart =
  | 'window-switcher'
  | 'tab-groups'
  | 'tab-rows'
  | 'action-bar'
  | 'search-field'
  | 'search-results'
  | 'appearance-settings'

const accentColors: Record<ThemeAccentPalette, string> = {
  red: '#e5484d',
  orange: '#f76b15',
  amber: '#f5a623',
  yellow: '#f2c230',
  lime: '#99c221',
  green: '#30a46c',
  emerald: '#12a594',
  teal: '#12a8a1',
  cyan: '#00a2c7',
  sky: '#0091ff',
  blue: '#3e63dd',
  indigo: '#5753c9',
  violet: '#6e56cf',
  purple: '#8e4ec6',
  fuchsia: '#d6409f',
  pink: '#d6409f',
  rose: '#e54666',
}

const anatomyParts: {
  id: AnatomyPart
  title: string
  product: 'manager' | 'omnibar' | 'options'
  description: string
}[] = [
  {
    id: 'window-switcher',
    title: 'Window switcher',
    product: 'manager',
    description: 'Name each window and choose it to open its Tab Manager.',
  },
  {
    id: 'tab-groups',
    title: 'Tab groups',
    product: 'manager',
    description:
      'Keep related tabs together and see their group color, name, and selection state.',
  },
  {
    id: 'tab-rows',
    title: 'Tab rows',
    product: 'manager',
    description:
      'Scan page titles and status at a glance, then select one or more tabs to act on them.',
  },
  {
    id: 'action-bar',
    title: 'Action bar',
    product: 'manager',
    description:
      'Search and Settings sit at the left; tab actions sit at the right.',
  },
  {
    id: 'search-field',
    title: 'Search field',
    product: 'omnibar',
    description:
      'Search open tabs, groups, bookmarks, history, and recently closed pages together.',
  },
  {
    id: 'search-results',
    title: 'Search results',
    product: 'omnibar',
    description:
      'Open a result in the existing tab or as a new tab, all against the sample browser.',
  },
  {
    id: 'appearance-settings',
    title: 'Appearance settings',
    product: 'options',
    description:
      'Explore appearance controls and compare preferences in sharing mode.',
  },
]

const productLabels = {
  manager: 'Tab manager',
  omnibar: 'Omnibar',
  options: 'Options',
} as const
const products = Object.keys(productLabels) as Product[]
const initialSharing: Sharing = {
  data: false,
  state: false,
  preferences: false,
}

const Panel = ({
  scenario,
  index,
  comparisonEnabled,
  mode,
  size,
  onSizeChange,
  isAppearanceTarget,
  onProductChange,
  anatomyPart,
  playing,
}: {
  scenario: Scenario
  index: number
  comparisonEnabled: boolean
  mode: SurfaceInputMode
  size: InstanceSize
  onSizeChange: (size: InstanceSize) => void
  isAppearanceTarget: boolean
  onProductChange: (product: Product) => void
  anatomyPart: AnatomyPart | null
  playing: boolean
}) => {
  const resources = scenario.resources[index]!
  const data = useSyncExternalStore(
    resources.backend.subscribe,
    resources.backend.getSnapshot,
    resources.backend.getSnapshot,
  )
  const view = useStore(resources.view)
  const navigation = useStore(scenario.navigation[index]!)
  const root = useRef<HTMLDivElement>(null)
  const pointer = useRef<HTMLSpanElement>(null)
  const cue = mode === 'scripted' && index === 0 ? scenario.getCue() : null
  useEffect(
    () => onProductChange(navigation.product),
    [navigation.product, onProductChange],
  )
  useLayoutEffect(() => {
    if (!root.current || !pointer.current || cue?.kind !== 'mouse') return
    const item = root.current.querySelector(
      `[data-${cue.item.type}-id="${cue.item.id}"]`,
    )
    if (!item) {
      pointer.current.style.visibility = 'hidden'
      return
    }
    const box = item.getBoundingClientRect()
    const outer = root.current.getBoundingClientRect()
    pointer.current.style.visibility = 'visible'
    pointer.current.style.left = `${box.left - outer.left + Math.min(box.width - 12, 110)}px`
    pointer.current.style.top = `${box.top - outer.top + box.height / 2}px`
  }, [cue, navigation.product, view.scrollTop])

  return (
    <section
      className="instance"
      aria-label={
        comparisonEnabled
          ? `Instance ${index === 0 ? 'A' : 'B'}`
          : 'Tabby product demo'
      }
      data-focused={comparisonEnabled && isAppearanceTarget}
    >
      <div className="instance-heading">
        <div className="instance-title">
          {comparisonEnabled && (
            <span className="instance-index">0{index + 1}</span>
          )}
          <div>
            <strong>
              {comparisonEnabled
                ? `Instance ${index === 0 ? 'A' : 'B'}`
                : 'Tabby'}
            </strong>
            <span>
              {data.windows.length} windows · {data.tabs.length} tabs
            </span>
          </div>
        </div>
      </div>

      {navigation.product === 'manager' && (
        <div className="instance-tools">
          <div
            className="instance-tool-group"
            role="group"
            aria-label="Viewport"
          >
            <button
              aria-pressed={size === 'wide'}
              onClick={() => onSizeChange('wide')}
            >
              Wide
            </button>
            <button
              aria-pressed={size === 'narrow'}
              onClick={() => onSizeChange('narrow')}
            >
              Narrow
            </button>
          </div>
        </div>
      )}

      <div
        className="product-stage"
        data-product={navigation.product}
        data-size={navigation.product === 'manager' ? size : undefined}
      >
        <div
          ref={root}
          className="product-frame"
          data-product={navigation.product}
          data-size={navigation.product === 'manager' ? size : undefined}
          data-playing={playing}
          data-anatomy={anatomyPart ?? undefined}
        >
          <TabbySurface
            instanceId={index === 0 ? 'left' : 'right'}
            inputMode={mode}
            motion={
              mode === 'live'
                ? 'system'
                : mode === 'scripted' && playing
                  ? 'full'
                  : 'reduced'
            }
          >
            {navigation.product === 'manager' && (
              <TabManagerExperience controller={scenario.controllers[index]} />
            )}
            {navigation.product === 'omnibar' && (
              <OmnibarExperience
                className="h-full"
                onDismiss={() =>
                  scenario.navigation[index]!.setState({ product: 'manager' })
                }
              />
            )}
            {navigation.product === 'options' && <OptionsExperience />}
          </TabbySurface>
          {cue?.kind === 'mouse' && (
            <span
              aria-hidden
              className="demo-pointer"
              data-click={cue.label === 'Click'}
              ref={pointer}
            >
              <svg width="26" height="32" viewBox="0 0 26 32">
                <path
                  d="M2 2v24l6-6 5 10 5-2-5-10h9Z"
                  fill="white"
                  stroke="#172033"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="pointer-label">{cue.label}</span>
            </span>
          )}
          {cue?.kind === 'keyboard' && (
            <span className="key-cue">{cue.label}</span>
          )}
        </div>
      </div>

      {navigation.notice && (
        <div className="host-notice" role="status">
          {navigation.notice}
          <button
            aria-label="Dismiss host notice"
            onClick={() =>
              scenario.navigation[index]!.setState({ notice: null })
            }
          >
            ×
          </button>
        </div>
      )}
      <div className="instance-footer">
        <span>
          Selection: {view.selection.selection.tabIds.size} tabs ·{' '}
          {view.selection.selection.groupIds.size} groups
        </span>
        <span className="instance-product-label">
          {productLabels[navigation.product]}
        </span>
      </div>
    </section>
  )
}

const DemoStudio = ({ initial }: { initial: Scenario }) => {
  const [scenario, setScenario] = useState(initial)
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [sharing, setSharing] = useState<Sharing>(initialSharing)
  const [ignoreCommands, setIgnoreCommands] = useState(false)
  const [dataset, setDataset] = useState<Dataset>('standard')
  const [mode, setMode] = useState<SurfaceInputMode>('live')
  const [selectedProduct, setSelectedProduct] = useState<Product>('manager')
  const [sizes, setSizes] = useState<InstanceSize[]>(['wide', 'wide'])
  const [studioPage, setStudioPage] = useState<StudioPage>('explore')
  const [anatomyPart, setAnatomyPart] = useState<AnatomyPart>('window-switcher')
  const [appearanceTarget, setAppearanceTarget] = useState(0)
  const playback = useSyncExternalStore(
    scenario.player.subscribe,
    scenario.player.getSnapshot,
    scenario.player.getSnapshot,
  )
  const generation = useRef(0)
  useEffect(() => () => scenario.dispose(), [scenario])
  const handleProductChange = useCallback((product: Product) => {
    setSelectedProduct(product)
    setAnatomyPart((current) =>
      anatomyParts.some(
        (part) => part.id === current && part.product === product,
      )
        ? current
        : anatomyParts.find((part) => part.product === product)!.id,
    )
  }, [])

  const configure = async (
    nextSharing: Sharing,
    nextIgnore: boolean,
    nextDataset: Dataset = dataset,
    nextMode: SurfaceInputMode = mode,
  ) => {
    const operation = ++generation.current
    const normalizedSharing = {
      ...nextSharing,
      state: nextSharing.data && nextSharing.state,
    }
    const next = await createScenario(
      normalizedSharing,
      nextIgnore,
      nextDataset,
    )
    if (operation !== generation.current) {
      next.dispose()
      return
    }
    next.setInputMode(nextMode)
    setSharing(normalizedSharing)
    setIgnoreCommands(nextIgnore)
    setDataset(nextDataset)
    setMode(nextMode)
    setSelectedProduct('manager')
    setAnatomyPart('window-switcher')
    setScenario(next)
  }

  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setAnatomyPart(anatomyParts.find((part) => part.product === product)!.id)
    new Set(scenario.navigation).forEach((navigation) =>
      navigation.setState({ product, notice: null }),
    )
  }

  const changeMode = (next: SurfaceInputMode) => {
    scenario.player.pause()
    scenario.setInputMode(next)
    scenario.reset()
    setMode(next)
    setSelectedProduct('manager')
    setAnatomyPart('window-switcher')
    if (next === 'scripted') {
      setStudioPage('guided')
    } else if (studioPage === 'guided') {
      setStudioPage('explore')
    }
  }

  const focusAnatomyPart = (partId: AnatomyPart) => {
    const part = anatomyParts.find((item) => item.id === partId)!
    selectProduct(part.product)
    setAnatomyPart(partId)
    if (partId === 'search-results') {
      scenario.omnibarResources.forEach((resource, index) => {
        const showResults = async () => {
          const results = await resource.search('Tabby')
          const view = scenario.omnibarViews[index]!
          view.setState({
            ...view.getState(),
            query: 'Tabby',
            edited: true,
            resultsQuery: 'Tabby',
            externalResults: results,
          })
        }
        void showResults().catch((error: unknown) =>
          console.error('Could not load the search anatomy results', error),
        )
      })
    }
  }

  const changeStudioPage = (next: StudioPage) => {
    if (next === 'guided') {
      if (mode !== 'scripted') changeMode('scripted')
      else scenario.player.seek(0)
      setStudioPage('guided')
      return
    }
    if (mode !== 'live') changeMode('live')
    if (next === 'anatomy') {
      const product = mode === 'scripted' ? 'manager' : selectedProduct
      const nextPart = anatomyParts.find((part) => part.product === product)!
      focusAnatomyPart(nextPart.id)
    }
    setStudioPage(next)
  }

  const selectExperience = (
    experience: 'explore' | 'guided' | 'still' | 'anatomy',
  ) => {
    if (experience === 'still') {
      changeMode('static')
      setStudioPage('explore')
      return
    }
    changeStudioPage(experience === 'anatomy' ? 'anatomy' : experience)
  }

  const resetDemo = () => {
    void configure(initialSharing, false, 'standard', 'live')
    setComparisonEnabled(false)
    setStudioPage('explore')
    setSizes(['wide', 'wide'])
    setAnatomyPart('window-switcher')
    setAppearanceTarget(0)
  }

  const appearancePreferences =
    scenario.resources[appearanceTarget]!.preferences
  const preferenceState = useSyncExternalStore(
    appearancePreferences.subscribe,
    appearancePreferences.getSnapshot,
    appearancePreferences.getSnapshot,
  )
  const appearanceTheme =
    preferenceState.theme === 'system'
      ? scenario.resources[appearanceTarget]!.environment.systemTheme
      : preferenceState.theme
  const appearancePrefix =
    appearanceTheme === 'light' ? 'themeLight' : 'themeDark'
  const setPalettePreference = (
    field: 'Background' | 'Foreground' | 'Accent',
    value: string,
  ) => {
    const key = `${appearancePrefix}${field}` as
      | 'themeLightBackground'
      | 'themeDarkBackground'
      | 'themeLightForeground'
      | 'themeDarkForeground'
      | 'themeLightAccent'
      | 'themeDarkAccent'
    void appearancePreferences.set({ [key]: value })
  }

  const productParts = anatomyParts.filter(
    (part) => part.product === selectedProduct,
  )
  const selectedPart = productParts.find((part) => part.id === anatomyPart)!
  const activeChapter =
    playback.time < 11200 ? 0 : playback.time < 17200 ? 1 : 2
  const guidedDuration = `${String(Math.floor(playback.duration / 60000)).padStart(2, '0')}:${String(Math.floor(playback.duration / 1000) % 60).padStart(2, '0')}`
  const chapters = [
    {
      label: 'Tab manager',
      at: 0,
      detail: 'Select, organize, and act on tabs',
    },
    {
      label: 'Omnibar',
      at: 11200,
      detail: 'Search tabs, bookmarks, and history',
    },
    { label: 'Options', at: 17200, detail: 'Explore appearance preferences' },
  ]

  return (
    <>
      <div className="topbar">
        <a className="brand" href="/" aria-label="Tabby Demo Studio">
          <img src={logoUrl} alt="" />
          <span className="brand-name">tabby</span>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-context">Demo Studio</span>
        </a>
        <div className="topbar-actions">
          <a className="reset-button" href="?theme-lab">
            Theme lab
          </a>
          <span className="local-badge">
            <span className="status-dot" />
            Local sample
          </span>
          <button className="reset-button" onClick={resetDemo}>
            <span aria-hidden="true">↻</span> Reset demo
          </button>
        </div>
      </div>

      <main className="studio-shell">
        <section className="studio-intro">
          <div>
            <p className="eyebrow">A live product sandbox</p>
            <h1>Make room for the tabs that matter.</h1>
            <p className="intro-copy">
              Explore the real Tabby experiences with sample browser data.
              Choose a product, explore sample browser data, follow a guided
              flow, or inspect how its pieces fit together.
            </p>
          </div>
          <div className="privacy-note">
            <span className="privacy-icon" aria-hidden="true">
              ⌘
            </span>
            <span>
              Nothing here connects to your browser or changes your tabs.
            </span>
          </div>
        </section>

        <div className="studio-layout">
          <aside className="studio-sidebar" aria-label="Demo controls">
            <section className="control-card">
              <div className="control-card-heading">
                <div>
                  <p className="eyebrow">Customize</p>
                  <h2>Demo controls</h2>
                </div>
                <span className="settings-mark" aria-hidden="true">
                  ✳
                </span>
              </div>

              <section className="control-section">
                <div className="control-title-row">
                  <h3>Sample workspace</h3>
                  <span className="control-value">
                    {dataset === 'large' ? '400 tabs' : 'Memory data'}
                  </span>
                </div>
                <select
                  aria-label="Sample data"
                  value={dataset}
                  onChange={(event) =>
                    void configure(
                      sharing,
                      ignoreCommands,
                      event.target.value as Dataset,
                    )
                  }
                >
                  <option value="single-window">Single window</option>
                  <option value="standard">Standard browser</option>
                  <option value="many-windows">Many windows</option>
                  <option value="large">400 tabs</option>
                  <option value="restricted">
                    Normal and incognito windows
                  </option>
                  <option value="loading">Loading</option>
                  <option value="error">Loading error</option>
                  <option value="empty">Empty browser</option>
                </select>
                <p className="control-help">
                  Pick the sample browser state shown in each instance.
                </p>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={ignoreCommands}
                    onChange={(event) =>
                      void configure(sharing, event.target.checked)
                    }
                  />
                  <span>Ignore data commands</span>
                </label>
                <p className="control-help">
                  Product actions respond, but sample data stays unchanged.
                </p>
              </section>

              <section className="control-section">
                <div className="control-title-row">
                  <h3>Instances</h3>
                </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={comparisonEnabled}
                    onChange={(event) => {
                      if (event.target.checked) selectProduct(selectedProduct)
                      else setAppearanceTarget(0)
                      setComparisonEnabled(event.target.checked)
                    }}
                  />
                  <span>Compare a second instance</span>
                </label>
                <p className="control-help">
                  Add another product surface to explore sharing independently.
                </p>
              </section>

              {comparisonEnabled && (
                <section className="control-section">
                  <div className="control-title-row">
                    <h3>Sharing</h3>
                  </div>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={sharing.data}
                      onChange={(event) =>
                        void configure(
                          {
                            ...sharing,
                            data: event.target.checked,
                            state: event.target.checked ? sharing.state : false,
                          },
                          ignoreCommands,
                        )
                      }
                    />
                    <span>Share browser data</span>
                  </label>
                  <label className="toggle-row sharing-dependent">
                    <input
                      type="checkbox"
                      checked={sharing.state}
                      disabled={!sharing.data}
                      onChange={(event) =>
                        void configure(
                          { ...sharing, state: event.target.checked },
                          ignoreCommands,
                        )
                      }
                    />
                    <span>Share view state</span>
                  </label>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={sharing.preferences}
                      onChange={(event) =>
                        void configure(
                          { ...sharing, preferences: event.target.checked },
                          ignoreCommands,
                        )
                      }
                    />
                    <span>Share preferences</span>
                  </label>
                </section>
              )}

              <section className="control-section">
                <div className="control-title-row">
                  <h3>Experience</h3>
                </div>
                <div
                  className="experience-options"
                  role="group"
                  aria-label="Demo experience"
                >
                  {(
                    [
                      {
                        value: 'explore',
                        title: 'Explore',
                        detail: 'Fully interactive',
                        icon: '↗',
                        active: studioPage === 'explore' && mode === 'live',
                      },
                      {
                        value: 'guided',
                        title: 'Guided',
                        detail: 'Mouse and keyboard demo',
                        icon: '▶',
                        active: studioPage === 'guided',
                      },
                      {
                        value: 'still',
                        title: 'Still',
                        detail: 'Input and motion paused',
                        icon: 'Ⅱ',
                        active: studioPage === 'explore' && mode === 'static',
                      },
                      {
                        value: 'anatomy',
                        title: 'Anatomy',
                        detail: 'Explore product components',
                        icon: '◉',
                        active: studioPage === 'anatomy',
                      },
                    ] as const
                  ).map(({ value, title, detail, icon, active }) => (
                    <button
                      key={value}
                      className="experience-option"
                      aria-pressed={active}
                      onClick={() => selectExperience(value)}
                    >
                      <span className="experience-icon" aria-hidden="true">
                        {icon}
                      </span>
                      <span>
                        <strong>{title}</strong>
                        <small>{detail}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="control-section appearance-controls">
                <div className="control-title-row">
                  <h3>Appearance</h3>
                  <span className="control-value">
                    {comparisonEnabled
                      ? `Instance ${appearanceTarget === 0 ? 'A' : 'B'}`
                      : 'Tabby'}
                  </span>
                </div>
                {comparisonEnabled && (
                  <div
                    className="appearance-target-row"
                    role="group"
                    aria-label="Appearance target"
                  >
                    <button
                      aria-pressed={appearanceTarget === 0}
                      onClick={() => setAppearanceTarget(0)}
                    >
                      Instance A
                    </button>
                    <button
                      aria-pressed={appearanceTarget === 1}
                      onClick={() => setAppearanceTarget(1)}
                    >
                      Instance B
                    </button>
                  </div>
                )}
                <div
                  className="appearance-target-row appearance-theme-row"
                  role="group"
                  aria-label="Instance appearance"
                >
                  <button
                    aria-pressed={appearanceTheme === 'light'}
                    onClick={() =>
                      void appearancePreferences.set({ theme: 'light' })
                    }
                  >
                    Light
                  </button>
                  <button
                    aria-pressed={appearanceTheme === 'dark'}
                    onClick={() =>
                      void appearancePreferences.set({ theme: 'dark' })
                    }
                  >
                    Dark
                  </button>
                </div>
                {(['Background', 'Foreground'] as const).map((field) => {
                  const key = `${appearancePrefix}${field}` as
                    | 'themeLightBackground'
                    | 'themeDarkBackground'
                    | 'themeLightForeground'
                    | 'themeDarkForeground'
                  const value = preferenceState[key]
                  return (
                    <div className="palette-block" key={field}>
                      <div className="palette-heading">
                        <span>{field}</span>
                        <span className="palette-value">{value}</span>
                      </div>
                      <div
                        className="swatch-row"
                        role="group"
                        aria-label={`${field} color`}
                      >
                        {THEME_NEUTRAL_PALETTES.map((palette) => (
                          <button
                            key={palette}
                            className="color-swatch"
                            aria-label={`Choose ${palette} ${field.toLowerCase()} color`}
                            aria-pressed={value === palette}
                            title={palette}
                            onClick={() => setPalettePreference(field, palette)}
                          >
                            <span
                              style={{
                                backgroundColor: neutralColors[palette],
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <div className="palette-block">
                  <div className="palette-heading">
                    <span>Accent</span>
                    <span className="palette-value">
                      {
                        preferenceState[
                          `${appearancePrefix}Accent` as
                            | 'themeLightAccent'
                            | 'themeDarkAccent'
                        ]
                      }
                    </span>
                  </div>
                  <div
                    className="swatch-grid"
                    role="group"
                    aria-label="Accent color"
                  >
                    {THEME_ACCENT_PALETTES.map((palette) => (
                      <button
                        key={palette}
                        className="color-swatch"
                        aria-label={`Choose ${palette} accent color`}
                        aria-pressed={
                          preferenceState[
                            `${appearancePrefix}Accent` as
                              | 'themeLightAccent'
                              | 'themeDarkAccent'
                          ] === palette
                        }
                        title={palette}
                        onClick={() => setPalettePreference('Accent', palette)}
                      >
                        <span
                          style={{ backgroundColor: accentColors[palette] }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </section>
          </aside>

          <section className="stage-shell" aria-label="Demo stage">
            <div className="stage-heading">
              <div>
                <p className="eyebrow">Tabby experiences</p>
                <h2>
                  {studioPage === 'guided'
                    ? 'See a workflow unfold.'
                    : studioPage === 'anatomy'
                      ? 'Explore the pieces.'
                      : 'Explore your workspace.'}
                </h2>
                <p>
                  {studioPage === 'guided'
                    ? 'Follow real mouse and keyboard actions across Tab manager, Omnibar, and Options.'
                    : studioPage === 'anatomy'
                      ? `Explore ${productLabels[selectedProduct]} components in the live demo.`
                      : comparisonEnabled
                        ? 'Compare how browser data, view state, and preferences are shared.'
                        : 'Try one product instance with sample browser data.'}
                </p>
              </div>
            </div>

            {studioPage !== 'guided' && (
              <nav className="product-picker" aria-label="Product experience">
                {products.map((product) => (
                  <button
                    key={product}
                    aria-pressed={selectedProduct === product}
                    onClick={() => selectProduct(product)}
                  >
                    {productLabels[product]}
                  </button>
                ))}
              </nav>
            )}

            {studioPage === 'guided' && (
              <div className="guided-panel">
                <div className="guided-intro">
                  <div>
                    <p className="eyebrow">Guided demo</p>
                    <h3>One browser, three experiences</h3>
                    <p>
                      The same sample data moves from tab management to search
                      and settings.
                    </p>
                  </div>
                  <span className="guided-duration">{guidedDuration}</span>
                </div>
                <div
                  className="chapter-cards"
                  role="group"
                  aria-label="Demo chapters"
                >
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.label}
                      aria-pressed={activeChapter === index}
                      onClick={() => scenario.player.seek(chapter.at)}
                    >
                      <span className="chapter-number">0{index + 1}</span>
                      <span>
                        <strong>{chapter.label}</strong>
                        <small>{chapter.detail}</small>
                      </span>
                      <span className="chapter-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  ))}
                </div>
                <DemoTransport
                  player={scenario.player}
                  steps={scenario.steps}
                  name="Product tour"
                />
              </div>
            )}

            {mode === 'static' && (
              <div className="mode-note" role="status">
                <span aria-hidden="true">Ⅱ</span>
                Still frame: product input and motion are paused.
              </div>
            )}

            {studioPage === 'anatomy' && (
              <div className="anatomy-panel">
                <div className="anatomy-detail">
                  <span className="anatomy-detail-mark">
                    0
                    {productParts.findIndex((part) => part.id === anatomyPart) +
                      1}
                  </span>
                  <div>
                    <strong>{selectedPart.title}</strong>
                    <p>{selectedPart.description}</p>
                  </div>
                </div>
                <div
                  className="anatomy-parts"
                  role="group"
                  aria-label={`${productLabels[selectedProduct]} components`}
                >
                  {productParts.map((part, index) => (
                    <button
                      key={part.id}
                      aria-pressed={anatomyPart === part.id}
                      onClick={() => focusAnatomyPart(part.id)}
                    >
                      <span>0{index + 1}</span>
                      {part.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="instances" data-comparing={comparisonEnabled}>
              {scenario.resources
                .slice(0, comparisonEnabled ? 2 : 1)
                .map((_, index) => (
                  <TabbyProvider
                    key={index}
                    {...scenario.providerResources[index]!}
                  >
                    <Panel
                      scenario={scenario}
                      index={index}
                      comparisonEnabled={comparisonEnabled}
                      mode={mode}
                      size={sizes[index]!}
                      onSizeChange={(size) =>
                        setSizes((current) =>
                          current.map((value, position) =>
                            position === index ? size : value,
                          ),
                        )
                      }
                      isAppearanceTarget={appearanceTarget === index}
                      onProductChange={handleProductChange}
                      anatomyPart={
                        studioPage === 'anatomy' ? anatomyPart : null
                      }
                      playing={playback.playing}
                    />
                  </TabbyProvider>
                ))}
            </div>
          </section>
        </div>
        <footer className="studio-footer">
          Tab manager, Omnibar, and Options run with deterministic sample data
          and local memory resources.
        </footer>
      </main>
    </>
  )
}

let disposed = false
let applicationRoot: ReturnType<typeof createRoot> | undefined
const initialize = async () => {
  const initial = await createScenario(initialSharing, false)
  if (disposed) {
    initial.dispose()
    return
  }
  applicationRoot = createRoot(document.getElementById('root')!)
  initial.setInputMode('live')
  if (new URLSearchParams(location.search).has('theme-lab')) {
    const { ThemeLab } = await import('./ThemeLab')
    if (!disposed) applicationRoot.render(<ThemeLab scenario={initial} />)
  } else {
    applicationRoot.render(<DemoStudio initial={initial} />)
  }
}
void initialize().catch((error: unknown) =>
  console.error('Could not start the Demo Studio', error),
)
import.meta.hot?.dispose(() => {
  disposed = true
  applicationRoot?.unmount()
})
