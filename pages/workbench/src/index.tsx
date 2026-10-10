import './workbench.css'
import {
  OmnibarExperience,
  OptionsExperience,
  TabbyProvider,
  TabbySurface,
  TabManagerExperience,
  useTabbyPreferences,
} from '@extension/app'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createRoot } from 'react-dom/client'
import { useStore } from 'zustand'
import { DemoTransport } from './DemoTransport'
import { createScenario } from './scenario'
import type { Dataset, Scenario, Sharing } from './scenario'
import type { SurfaceInputMode } from '@extension/ui/Surface'

const Panel = ({
  scenario,
  index,
  mode,
  themeOverride,
  playing,
}: {
  scenario: Scenario
  index: number
  mode: SurfaceInputMode
  themeOverride: 'light' | 'dark' | 'preference'
  playing: boolean
}) => {
  const preferences = useTabbyPreferences()
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
      aria-label={index === 0 ? 'Left instance' : 'Right instance'}
    >
      <div className="instance-heading">
        <strong>{index === 0 ? 'Left' : 'Right'} instance</strong>
        <span>
          {data.windows.length} windows · {data.tabs.length} tabs · viewing{' '}
          {view.viewedWindowId ?? 'none'}
        </span>
      </div>
      <nav
        className="product-tabs"
        aria-label={`${index === 0 ? 'Left' : 'Right'} product`}
      >
        {(['manager', 'omnibar', 'options'] as const).map((product) => (
          <button
            key={product}
            aria-pressed={navigation.product === product}
            onClick={() => {
              if (mode === 'live')
                root.current
                  ?.querySelector<HTMLElement>('[data-surface]')
                  ?.focus({ preventScroll: true })
              scenario.navigation[index]!.setState({ product, notice: null })
            }}
          >
            {product === 'manager'
              ? 'Tab Manager'
              : product === 'omnibar'
                ? 'Omnibar'
                : 'Options'}
          </button>
        ))}
      </nav>
      <div ref={root} className="product-frame" data-playing={playing}>
        <TabbySurface
          instanceId={index === 0 ? 'left' : 'right'}
          theme={themeOverride === 'preference' ? undefined : themeOverride}
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
          Explicit selection: {view.selection.selection.tabIds.size} tabs,{' '}
          {view.selection.selection.groupIds.size} groups
        </span>
        <button
          onClick={() =>
            void resources.preferences.set({
              themeLightAccent:
                preferences.themeLightAccent === 'rose' ? 'amber' : 'rose',
              themeDarkAccent:
                preferences.themeDarkAccent === 'rose' ? 'blue' : 'rose',
            })
          }
        >
          Change accent
        </button>
      </div>
    </section>
  )
}

const Workbench = ({ initial }: { initial: Scenario }) => {
  const [scenario, setScenario] = useState(initial)
  const [sharing, setSharing] = useState<Sharing>('data')
  const [sharePreferences, setSharePreferences] = useState(false)
  const [ignoreCommands, setIgnoreCommands] = useState(false)
  const [dataset, setDataset] = useState<Dataset>('standard')
  const [mode, setMode] = useState<SurfaceInputMode>('live')
  const [themes, setThemes] = useState<('light' | 'dark' | 'preference')[]>([
    'light',
    'dark',
  ])
  const playback = useSyncExternalStore(
    scenario.player.subscribe,
    scenario.player.getSnapshot,
    scenario.player.getSnapshot,
  )
  const generation = useRef(0)
  useEffect(() => () => scenario.dispose(), [scenario])
  const configure = async (
    nextSharing: Sharing,
    nextPreferences: boolean,
    nextIgnore: boolean,
    nextDataset: Dataset = dataset,
  ) => {
    const operation = ++generation.current
    const next = await createScenario(
      nextSharing,
      nextPreferences,
      nextIgnore,
      nextDataset,
    )
    if (operation !== generation.current) {
      next.dispose()
      return
    }
    next.setInputMode(mode)
    setSharing(nextSharing)
    setSharePreferences(nextPreferences)
    setIgnoreCommands(nextIgnore)
    setDataset(nextDataset)
    setScenario(next)
  }
  const changeMode = (next: SurfaceInputMode) => {
    scenario.player.pause()
    scenario.setInputMode(next)
    scenario.reset()
    setMode(next)
  }
  return (
    <main className="workbench">
      <header>
        <p className="eyebrow">Reusable product workbench</p>
        <h1>The real product, on your terms.</h1>
        <p>
          Try Tab Manager, Omnibar, and Options with sample data. Choose what
          the instances share, then play a tutorial or stage a still frame.
        </p>
      </header>
      <div className="controls">
        <label>
          Sample data
          <select
            aria-label="Sample data"
            value={dataset}
            onChange={(event) =>
              void configure(
                sharing,
                sharePreferences,
                ignoreCommands,
                event.target.value as Dataset,
              )
            }
          >
            <option value="single-window">Single window</option>
            <option value="standard">Standard browser</option>
            <option value="many-windows">Many windows</option>
            <option value="large">400 tabs</option>
            <option value="restricted">Normal and incognito windows</option>
            <option value="loading">Loading</option>
            <option value="error">Loading error</option>
            <option value="empty">Empty browser</option>
          </select>
        </label>
        <label>
          Sharing
          <select
            aria-label="Sharing"
            value={sharing}
            onChange={(event) =>
              void configure(
                event.target.value as Sharing,
                sharePreferences,
                ignoreCommands,
              )
            }
          >
            <option value="none">Separate data and views</option>
            <option value="data">Shared data, separate views</option>
            <option value="all">Shared data and view state</option>
          </select>
        </label>
        <label>
          Experience
          <select
            aria-label="Experience"
            value={mode}
            onChange={(event) =>
              changeMode(event.target.value as SurfaceInputMode)
            }
          >
            <option value="live">Fully interactive</option>
            <option value="scripted">Scripted tutorial</option>
            <option value="static">Still frame</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={sharePreferences}
            onChange={(event) =>
              void configure(sharing, event.target.checked, ignoreCommands)
            }
          />
          Share preferences
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={ignoreCommands}
            onChange={(event) =>
              void configure(sharing, sharePreferences, event.target.checked)
            }
          />
          Ignore data commands
        </label>
        <button onClick={() => scenario.reset()}>Reset scene</button>
      </div>
      <div className="themes">
        {themes.map((theme, index) => (
          <label key={index}>
            {index === 0 ? 'Left' : 'Right'} theme
            <select
              aria-label={index === 0 ? 'Left theme' : 'Right theme'}
              value={theme}
              onChange={(event) =>
                setThemes((current) =>
                  current.map((value, position) =>
                    position === index
                      ? (event.target.value as typeof theme)
                      : value,
                  ),
                )
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="preference">Follow preferences</option>
            </select>
          </label>
        ))}
      </div>
      {mode === 'scripted' && (
        <DemoTransport player={scenario.player} steps={scenario.steps} />
      )}
      {mode === 'static' && (
        <p className="mode-note">
          Still frame: product input and motion are disabled.
        </p>
      )}
      <div className="instances">
        {scenario.resources.map((_, index) => (
          <TabbyProvider key={index} {...scenario.providerResources[index]!}>
            <Panel
              scenario={scenario}
              index={index}
              mode={mode}
              themeOverride={themes[index]!}
              playing={playback.playing}
            />
          </TabbyProvider>
        ))}
      </div>
      <footer>
        Change sharing to reset to deterministic sample data. In shared-data
        mode, closing or creating a window updates both lists; opening a window
        or selecting tabs stays local. Preference sharing is independent of view
        sharing.
      </footer>
    </main>
  )
}

let disposed = false
let applicationRoot: ReturnType<typeof createRoot> | undefined
void createScenario('data', false).then((initial) => {
  if (disposed) {
    initial.dispose()
    return
  }
  applicationRoot = createRoot(document.getElementById('root')!)
  initial.setInputMode('live')
  applicationRoot.render(<Workbench initial={initial} />)
})
import.meta.hot?.dispose(() => {
  disposed = true
  applicationRoot?.unmount()
})
