import './theme-lab.css'
import {
  OmnibarExperience,
  OptionsExperience,
  resolveTheme,
  TabbyProvider,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { THEME_ACCENT_PALETTES, THEME_NEUTRAL_PALETTES } from '@extension/core'
import { PaletteChoices } from '@extension/ui/PaletteChoices'
import { Surface } from '@extension/ui/Surface'
import { themeCombinationCount } from '@extension/ui/theme-audit/measure'
import { renderThemeReport } from '@extension/ui/theme-audit/report'
import {
  FindingColors,
  FindingDescription,
  ThemePreview,
  ThemeSamples,
} from '@extension/ui/theme-audit/ThemePreview'
import {
  accentSwatchByPalette,
  neutralSwatchByPalette,
} from '@extension/ui/theme-colors'
import { useEffect, useState, useSyncExternalStore } from 'react'
import logoUrl from '../../../chrome-extension/public/tabby-face-128.png?url'
import { useThemeAudit } from './useThemeAudit'
import type { Scenario } from './scenario'
import type { PreferenceResource, PreferenceState } from '@extension/core'
import type {
  ThemeFinding,
  ThemeSelection,
} from '@extension/ui/theme-audit/analyze'

type LabView = 'explore' | 'compare' | 'findings'
type Product = 'states' | 'manager' | 'omnibar' | 'options'
const defaults: ThemeSelection = {
  mode: 'dark',
  background: 'slate',
  foreground: 'neutral',
  accent: 'blue',
}
const ignoreDismiss = () => undefined

export const selectionFromURL = (
  params: URLSearchParams,
  prefix = '',
): ThemeSelection => {
  const background = params.get(`${prefix}background`)
  const foreground = params.get(`${prefix}foreground`)
  const accent = params.get(`${prefix}accent`)
  return {
    mode: params.get(`${prefix}mode`) === 'light' ? 'light' : defaults.mode,
    background:
      THEME_NEUTRAL_PALETTES.find((value) => value === background) ??
      defaults.background,
    foreground:
      THEME_NEUTRAL_PALETTES.find((value) => value === foreground) ??
      defaults.foreground,
    accent:
      THEME_ACCENT_PALETTES.find((value) => value === accent) ??
      defaults.accent,
  }
}

const preferencePatch = (
  selection: ThemeSelection,
): Partial<PreferenceState> => ({
  theme: selection.mode,
  themePreset: null,
  [`${selection.mode === 'light' ? 'themeLight' : 'themeDark'}Background`]:
    selection.background,
  [`${selection.mode === 'light' ? 'themeLight' : 'themeDark'}Foreground`]:
    selection.foreground,
  [`${selection.mode === 'light' ? 'themeLight' : 'themeDark'}Accent`]:
    selection.accent,
})

const useSelection = (resource: PreferenceResource): ThemeSelection => {
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  const theme = resolveTheme(state, 'light')
  return { ...theme, mode: theme.theme }
}

const PaletteControls = ({
  selection,
  onChange,
}: {
  selection: ThemeSelection
  onChange: (selection: ThemeSelection) => void
}) => (
  <div className="theme-lab-controls">
    <fieldset className="theme-lab-mode">
      <legend>Mode</legend>
      <div>
        {(['light', 'dark'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={selection.mode === mode}
            onClick={() => onChange({ ...selection, mode })}
          >
            {mode === 'light' ? 'Light' : 'Dark'}
          </button>
        ))}
      </div>
    </fieldset>
    {(['background', 'foreground', 'accent'] as const).map((field) => (
      <PaletteChoices
        key={field}
        label={field[0]!.toUpperCase() + field.slice(1)}
        value={selection[field]}
        palettes={
          field === 'accent' ? THEME_ACCENT_PALETTES : THEME_NEUTRAL_PALETTES
        }
        swatches={
          field === 'accent' ? accentSwatchByPalette : neutralSwatchByPalette
        }
        onChange={(value) => onChange({ ...selection, [field]: value })}
      />
    ))}
  </div>
)

const PreviewPane = ({
  scenario,
  index,
  product,
  highlight,
  onChange,
}: {
  scenario: Scenario
  index: number
  product: Product
  highlight?: ThemeFinding['sample']
  onChange: (selection: ThemeSelection) => void
}) => {
  const selection = useSelection(scenario.resources[index]!.preferences)
  return (
    <section
      className="theme-lab-pane"
      aria-label={`Palette ${index === 0 ? 'A' : 'B'}`}
    >
      <div className="theme-lab-pane-heading">
        <h2>Palette {index === 0 ? 'A' : 'B'}</h2>
        <span>{selection.mode} mode</span>
      </div>
      <PaletteControls selection={selection} onChange={onChange} />
      <ThemePreview
        selection={selection}
        compact={product !== 'states'}
        highlight={highlight}
        onPaletteChange={onChange}
      />
      {product !== 'states' && (
        <div className="theme-lab-product" data-product={product}>
          <TabbyProvider {...scenario.providerResources[index]!}>
            <TabbySurface motion="reduced">
              {product === 'manager' ? (
                <TabManagerExperience
                  controller={scenario.controllers[index]}
                />
              ) : product === 'omnibar' ? (
                <OmnibarExperience onDismiss={ignoreDismiss} />
              ) : (
                <OptionsExperience />
              )}
            </TabbySurface>
          </TabbyProvider>
        </div>
      )}
    </section>
  )
}

export const ThemeLab = ({ scenario }: { scenario: Scenario }) => {
  const [view, setView] = useState<LabView>(() =>
    new URLSearchParams(location.search).get('view') === 'observations'
      ? 'findings'
      : new URLSearchParams(location.search).has('compare')
        ? 'compare'
        : new URLSearchParams(location.search).has('mode')
          ? 'explore'
          : 'findings',
  )
  const [product, setProduct] = useState<Product>('states')
  const [highlight, setHighlight] = useState<ThemeFinding['sample']>(() => {
    const sample = new URLSearchParams(location.search).get('sample')
    return [
      'normal',
      'hover',
      'active',
      'selected',
      'selected-hover',
      'focus',
      'focus-resting',
      'focus-header',
      'header',
      'mode',
      'palette',
    ].includes(sample ?? '')
      ? (sample as ThemeFinding['sample'])
      : 'palette'
  })
  const { report, progress, durationMs, error, scanner, refresh, cancel } =
    useThemeAudit()
  const [inspecting, setInspecting] = useState<ThemeFinding | null>(null)
  const [filter, setFilter] = useState<'all' | ThemeFinding['kind']>('all')
  const [limit, setLimit] = useState(30)
  const selection = useSelection(scenario.resources[0]!.preferences)
  const comparison = useSelection(scenario.resources[1]!.preferences)
  const changePalette = (index: number, value: ThemeSelection) => {
    void scenario.resources[index]!.preferences.set(preferencePatch(value))
  }
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const initial = selectionFromURL(params)
    void scenario.resources[0]!.preferences.set(preferencePatch(initial))
    void scenario.resources[1]!.preferences.set(
      preferencePatch(
        params.has('compare')
          ? selectionFromURL(params, 'compare-')
          : {
              ...initial,
              mode: initial.mode === 'dark' ? 'light' : 'dark',
            },
      ),
    )
    return () => {
      scenario.dispose()
    }
  }, [scenario])
  useEffect(() => {
    const url = new URL(location.href)
    for (const [key, value] of Object.entries({
      mode: selection.mode,
      background: selection.background,
      foreground: selection.foreground,
      accent: selection.accent,
    }))
      url.searchParams.set(key, value)
    if (view === 'compare') {
      url.searchParams.set('compare', '')
      for (const [key, value] of Object.entries({
        mode: comparison.mode,
        background: comparison.background,
        foreground: comparison.foreground,
        accent: comparison.accent,
      }))
        url.searchParams.set(`compare-${key}`, value)
    } else {
      for (const key of [
        'compare',
        'compare-mode',
        'compare-background',
        'compare-foreground',
        'compare-accent',
      ])
        url.searchParams.delete(key)
    }
    if (view === 'findings') url.searchParams.set('view', 'observations')
    else url.searchParams.delete('view')
    url.searchParams.set('sample', highlight)
    history.replaceState(null, '', url)
  }, [
    view,
    comparison.mode,
    comparison.background,
    comparison.foreground,
    comparison.accent,
    selection.mode,
    selection.background,
    selection.foreground,
    selection.accent,
    highlight,
  ])

  const downloadReport = (format: 'json' | 'html') => {
    if (!report) return
    const blob = new Blob(
      [
        format === 'json'
          ? JSON.stringify(report, null, 2)
          : renderThemeReport(report, location.origin),
      ],
      { type: format === 'json' ? 'application/json' : 'text/html' },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tabby-theme-report.${format}`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
  const loadFinding = (finding: ThemeFinding) => {
    setInspecting(finding)
    changePalette(0, finding.selection)
    setHighlight(finding.sample)
    if (finding.alternative) {
      changePalette(1, finding.alternative)
      setView('compare')
    } else setView('explore')
    setProduct('states')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const findings =
    report?.findings.filter(
      (finding) => filter === 'all' || finding.kind === filter,
    ) ?? []
  const failures =
    report?.findings.filter((finding) => finding.severity === 'failure')
      .length ?? 0
  const suggestions =
    report?.findings.filter((finding) => finding.severity === 'warning')
      .length ?? 0
  const information =
    report?.findings.filter((finding) => finding.severity === 'info').length ??
    0
  const inspection = report?.findings.find(
    (finding) => finding.id === inspecting?.id,
  )
  return (
    <div className="theme-lab">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Back to Demo Studio">
          <img src={logoUrl} alt="" />
          <span className="brand-name">tabby</span>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-context">Theme lab</span>
        </a>
        <a className="theme-lab-back" href="/">
          Demo Studio
        </a>
      </header>
      <main className="theme-lab-shell">
        <div className="theme-lab-intro">
          <div>
            <h1>Review every theme combination.</h1>
            <p>
              The lab checks every combination automatically. Inspect real Tabby
              states and compare the colors that need a decision.
            </p>
          </div>
          <button
            className="theme-lab-primary"
            onClick={refresh}
            disabled={progress !== null}
          >
            {progress === null
              ? 'Recalculate audit'
              : `Scanning ${progress.toLocaleString()} / ${themeCombinationCount.toLocaleString()}`}
          </button>
        </div>
        <div className="theme-lab-toolbar">
          <nav aria-label="Theme lab views" className="theme-lab-tabs">
            {(['explore', 'compare', 'findings'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={view === value}
                onClick={() => {
                  setView(value)
                  if (value === 'findings') setInspecting(null)
                }}
              >
                {value === 'findings'
                  ? `Observations${report ? ` (${report.findings.length})` : ''}`
                  : value === 'compare'
                    ? 'Compare'
                    : 'Explore'}
              </button>
            ))}
          </nav>
          {view !== 'findings' && (
            <label className="theme-lab-product-choice">
              Preview
              <select
                aria-label="Preview"
                value={product}
                onChange={(event) => setProduct(event.target.value as Product)}
              >
                <option value="states">Interaction states</option>
                <option value="manager">Tab manager</option>
                <option value="omnibar">Search</option>
                <option value="options">Settings</option>
              </select>
            </label>
          )}
        </div>
        {error && (
          <p role="alert" className="theme-lab-error">
            {error}
          </p>
        )}
        {progress !== null && (
          <div className="theme-lab-progress" role="status">
            <progress
              value={progress}
              max={themeCombinationCount}
              aria-label="Color combinations checked"
            />
            <span>{progress.toLocaleString()} combinations checked</span>
            <button onClick={cancel}>Cancel scan</button>
          </div>
        )}
        {view !== 'findings' && inspection && (
          <aside
            className="theme-lab-inspection"
            aria-label="Observation to review"
          >
            <FindingColors finding={inspection} />
            <div>
              <FindingDescription finding={inspection} />
            </div>
            <button onClick={() => setView('findings')}>
              Back to all observations
            </button>
          </aside>
        )}
        {view === 'findings' ? (
          <section aria-label="Theme findings" className="theme-lab-results">
            <div className="theme-lab-results-heading">
              <div>
                <h2>
                  {report
                    ? `${report.combinations.toLocaleString()} combinations checked`
                    : progress !== null
                      ? 'Checking every combination'
                      : 'Audit paused'}
                </h2>
                <p>
                  {report
                    ? `${failures} contrast failures · ${suggestions} review suggestions · ${information} subtle palette pairs`
                    : 'Explore the previews while the audit runs.'}
                </p>
              </div>
              {report && (
                <div className="theme-lab-downloads">
                  <button onClick={() => downloadReport('html')}>
                    Download HTML report
                  </button>
                  <button onClick={() => downloadReport('json')}>
                    Download JSON
                  </button>
                </div>
              )}
            </div>
            <p className="theme-lab-explanation">
              These observations cover every combination and stay the same when
              you change preview colors. The audit reruns automatically when
              stylesheets change. Contrast failures use accessibility thresholds
              for text, focus, and selection indicators. Palette comparisons use
              text and details, background surfaces, or accent roles together.
              Similarity and hover visibility are advisory. Matching colors can
              be intentional; warnings help you compare them. Repeated
              observations are grouped by the palettes that affect their colors;
              Inspect opens the weakest measured example.
            </p>
            {report && (
              <>
                <label className="theme-lab-filter">
                  Show
                  <select
                    aria-label="Show"
                    value={filter}
                    onChange={(event) => {
                      setFilter(event.target.value as typeof filter)
                      setLimit(30)
                    }}
                  >
                    <option value="all">All findings</option>
                    <option value="contrast">Contrast failures</option>
                    <option value="similarity">Similar palettes</option>
                    <option value="state">Weak state changes</option>
                  </select>
                </label>
                <p className="theme-lab-count" role="status">
                  {findings.length} findings · showing{' '}
                  {Math.min(limit, findings.length)}
                </p>
                <ul className="theme-lab-finding-list">
                  {findings.slice(0, limit).map((finding) => (
                    <li key={finding.id}>
                      <button
                        onClick={() => loadFinding(finding)}
                        data-theme-result={finding.kind}
                        data-severity={finding.severity}
                      >
                        <FindingColors finding={finding} />
                        <span>
                          <span className="theme-lab-finding-kind">
                            {finding.severity === 'failure'
                              ? 'Low contrast'
                              : finding.kind === 'similarity'
                                ? finding.severity === 'info'
                                  ? 'Subtle palettes'
                                  : 'Near duplicates'
                                : 'Weak state change'}
                          </span>
                          <FindingDescription finding={finding} />
                          <small>
                            {finding.selection.mode} ·{' '}
                            {finding.selection.background} background ·{' '}
                            {finding.selection.foreground} foreground ·{' '}
                            {finding.selection.accent} accent
                          </small>
                        </span>
                        <span className="theme-lab-inspect">Inspect</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {findings.length === 0 && <p>No findings in this category.</p>}
                {limit < findings.length && (
                  <button
                    className="reset-button"
                    onClick={() => setLimit((value) => value + 30)}
                  >
                    Show more findings
                  </button>
                )}
              </>
            )}
          </section>
        ) : (
          <div className="theme-lab-panes" data-comparing={view === 'compare'}>
            {[0, ...(view === 'compare' ? [1] : [])].map((index) => (
              <PreviewPane
                key={index}
                scenario={scenario}
                index={index}
                product={product}
                highlight={index === 0 ? highlight : undefined}
                onChange={(value) => {
                  setInspecting(null)
                  changePalette(index, value)
                }}
              />
            ))}
          </div>
        )}
        <p className="theme-lab-footnote">
          {report && durationMs !== null && (
            <span data-theme-audit-duration={durationMs}>
              Audit completed in {(durationMs / 1000).toFixed(1)} seconds.{' '}
            </span>
          )}
          Color measurements come from the shared product styles and components.
          Each preview uses local sample data.
        </p>
      </main>
      <div ref={scanner} className="theme-lab-scanner" aria-hidden="true" inert>
        <Surface
          theme="dark"
          palette={{
            background: defaults.background,
            foreground: defaults.foreground,
            accent: defaults.accent,
          }}
          inputMode="static"
          motion="reduced"
        >
          <ThemeSamples mode="dark" />
        </Surface>
      </div>
    </div>
  )
}
