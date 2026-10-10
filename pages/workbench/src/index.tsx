import './workbench.css'
import {
  TabbyProvider,
  TabManagerExperience,
  useTabbyPreferences,
} from '@extension/app'
import { Surface } from '@extension/ui/Surface'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { createRoot } from 'react-dom/client'
import { useStore } from 'zustand'
import { createScenario } from './scenario'
import type { Scenario, Sharing } from './scenario'
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
    pointer.current.style.left = `${box.left - outer.left + 110}px`
    pointer.current.style.top = `${box.top - outer.top + box.height / 2}px`
  }, [cue])
  const theme =
    themeOverride === 'preference'
      ? preferences.theme === 'dark'
        ? 'dark'
        : 'light'
      : themeOverride
  const accent =
    theme === 'light'
      ? preferences.themeLightAccent
      : preferences.themeDarkAccent
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
      <div ref={root} className="product-frame">
        <Surface
          instanceId={index === 0 ? 'left' : 'right'}
          theme={theme}
          palette={{
            background:
              theme === 'light'
                ? preferences.themeLightBackground
                : preferences.themeDarkBackground,
            foreground:
              theme === 'light'
                ? preferences.themeLightForeground
                : preferences.themeDarkForeground,
            accent,
            strength:
              theme === 'light'
                ? preferences.themeLightAccentStrength
                : preferences.themeDarkAccentStrength,
          }}
          inputMode={mode}
          motion={
            mode === 'live'
              ? 'system'
              : mode === 'scripted' && playing
                ? 'full'
                : 'reduced'
          }
        >
          <TabManagerExperience controller={scenario.controllers[index]} />
        </Surface>
        {cue?.kind === 'mouse' && (
          <span aria-hidden className="demo-pointer" ref={pointer}>
            ↖
          </span>
        )}
        {cue?.kind === 'keyboard' && (
          <span className="key-cue">{cue.label}</span>
        )}
      </div>
      <div className="instance-footer">
        <span>
          Selected: {view.selection.selection.tabIds.size} tabs,{' '}
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
  ) => {
    const operation = ++generation.current
    const next = await createScenario(nextSharing, nextPreferences, nextIgnore)
    if (operation !== generation.current) {
      next.dispose()
      return
    }
    setSharing(nextSharing)
    setSharePreferences(nextPreferences)
    setIgnoreCommands(nextIgnore)
    setScenario(next)
  }
  const changeMode = (next: SurfaceInputMode) => {
    scenario.player.pause()
    scenario.reset()
    setMode(next)
  }
  return (
    <main className="workbench">
      <header>
        <p className="eyebrow">Architecture foundation · alignment review</p>
        <h1>One Tab Manager. Two independent surfaces.</h1>
        <p>
          Try the real components with in-memory browser data. Choose what the
          instances share, then play a tutorial or stage a still frame.
        </p>
      </header>
      <div className="controls">
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
        <section className="transport" aria-label="Tutorial controls">
          <div>
            <strong>{playback.title}</strong>
            <span>
              Step {playback.step + 1} of 9 ·{' '}
              {playback.playing ? 'Playing' : 'Paused'}
            </span>
          </div>
          <div className="step-segments" aria-label="Tutorial steps">
            {scenario.steps.map((step, index) => (
              <button
                key={step.at}
                aria-label={`Jump to step ${index + 1}: ${step.title}`}
                aria-current={playback.step === index ? 'step' : undefined}
                onClick={() => scenario.player.seek(step.at)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="transport-buttons">
            <button onClick={() => scenario.player.rewind()}>Rewind</button>
            <button onClick={() => scenario.player.previous()}>
              Previous step
            </button>
            <button
              onClick={() =>
                playback.playing
                  ? scenario.player.pause()
                  : scenario.player.play()
              }
            >
              {playback.playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => scenario.player.next()}>Next step</button>
            <input
              aria-label="Tutorial progress"
              type="range"
              min="0"
              max={playback.duration}
              value={playback.time}
              onChange={(event) =>
                scenario.player.seek(Number(event.target.value))
              }
            />
          </div>
          <p>
            The product ignores physical hover, clicks, keys and scrolling while
            playing or paused. Step jumps restore the data, selection, panels,
            scroll, clock and cues.
          </p>
        </section>
      )}
      {mode === 'static' && (
        <p className="mode-note">
          Still frame: product input and motion are disabled.
        </p>
      )}
      <div className="instances">
        {scenario.resources.map((resources, index) => (
          <TabbyProvider key={index} {...resources}>
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

void createScenario('data', false).then((initial) =>
  createRoot(document.getElementById('root')!).render(
    <Workbench initial={initial} />,
  ),
)
