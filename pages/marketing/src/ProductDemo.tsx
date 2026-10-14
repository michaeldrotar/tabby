import {
  OmnibarExperience,
  OptionsExperience,
  TabbySurface,
  TabManagerExperience,
  useTabbyPreferences,
  useTabbyResources,
} from '@extension/app'
import { createDemoPlayer } from '@extension/demo/player'
import { MemoryTabbyProvider } from '@extension/providers/memory'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { assets } from './content'
import { createMarketingDemo, searchExamples } from './demo'
import type { ThemeAccentPalette } from '@extension/core'

const scheduler = {
  now: () => performance.now(),
  schedule: (callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    return () => clearTimeout(timer)
  },
}
const accents = [
  { name: 'orange', color: '#db762e' },
  { name: 'violet', color: '#8764ce' },
  { name: 'teal', color: '#278c81' },
  { name: 'rose', color: '#ce5879' },
] satisfies { name: ThemeAccentPalette; color: string }[]

const AppearanceControls = ({ labelled }: { labelled: boolean }) => {
  const { preferences } = useTabbyResources()
  const appearance = useTabbyPreferences()
  return (
    <div className="appearance-controls">
      {labelled && <span className="demo-control-label">Demo colors</span>}
      <button
        type="button"
        onClick={() =>
          void preferences.set({
            theme: appearance.theme === 'dark' ? 'light' : 'dark',
          })
        }
      >
        {appearance.theme === 'dark' ? 'Light' : 'Dark'} mode
      </button>
      {accents.map(({ name, color }) => (
        <button
          type="button"
          className="swatch"
          key={name}
          aria-label={`${name} accent`}
          aria-pressed={
            appearance[
              appearance.theme === 'dark'
                ? 'themeDarkAccent'
                : 'themeLightAccent'
            ] === name
          }
          style={{ backgroundColor: color }}
          onClick={() =>
            void preferences.set({
              themeLightAccent: name,
              themeDarkAccent: name,
            })
          }
        />
      ))}
    </div>
  )
}

export type ProductDemoProps = {
  theme?: 'light' | 'dark'
  initialExperience?: 'manager' | 'search'
  capture?: boolean
  separated?: boolean
  showTour?: boolean
}

export const ProductDemo = ({
  theme = 'light',
  initialExperience = 'manager',
  capture = false,
  separated = false,
  showTour = true,
}: ProductDemoProps) => {
  const [demo] = useState(() => createMarketingDemo(theme))
  const [player] = useState(() =>
    createDemoPlayer(demo.frames, demo.restore, scheduler, (state) =>
      structuredClone(state),
    ),
  )
  const playback = useSyncExternalStore(
    player.subscribe,
    player.getSnapshot,
    player.getSnapshot,
  )
  const [mode, setMode] = useState<'live' | 'scripted'>('live')
  const [experience, setExperience] = useState<
    'manager' | 'search' | 'options'
  >(initialExperience)
  const [notice, setNotice] = useState('')
  const shownExperience =
    mode === 'scripted'
      ? demo.frames[playback.step]!.state.experience
      : experience
  useEffect(() => () => player.dispose(), [player])
  const explore = (next: typeof experience) => {
    player.pause()
    setMode('live')
    setExperience(next)
    setNotice('')
  }
  const play = () => {
    setNotice('')
    if (mode === 'live') {
      player.rewind()
      setMode('scripted')
      player.play()
      return
    }
    setMode('scripted')
    if (playback.playing) player.pause()
    else player.play()
  }
  const reset = () => {
    player.pause()
    player.rewind()
    demo.restore(demo.initial)
    explore(initialExperience)
  }
  return (
    <div
      className={[
        'product-demo',
        capture && 'capture-demo',
        separated && 'product-demo--separated',
      ]
        .filter(Boolean)
        .join(' ')}
      data-demo
    >
      <MemoryTabbyProvider
        resources={{ backend: demo.backend, preferences: demo.preferences }}
        views={demo.views}
        optionsMetadata={{ logoUrl: assets.face }}
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
              Settings
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
            inputMode={mode === 'scripted' ? 'scripted' : 'live'}
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
          {showTour && (
            <button type="button" className="tour-control" onClick={play}>
              {playback.playing
                ? 'Pause tour'
                : playback.time === playback.duration
                  ? 'Replay tour'
                  : 'Play tour'}{' '}
              <span aria-hidden="true">{playback.playing ? 'Ⅱ' : '▷'}</span>
            </button>
          )}
        </div>
        <div className="demo-caption" aria-live="polite">
          {notice ||
            (mode === 'scripted'
              ? playback.title
              : 'Try it here. These are sample tabs.')}
        </div>
        {mode === 'scripted' && (
          <label className="tour-progress">
            Tour progress
            <input
              aria-label="Tour progress"
              type="range"
              min="0"
              max={playback.duration}
              value={playback.time}
              onChange={(event) => player.seek(Number(event.target.value))}
            />
          </label>
        )}
      </MemoryTabbyProvider>
    </div>
  )
}
