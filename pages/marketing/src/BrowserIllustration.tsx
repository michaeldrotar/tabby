import {
  OmnibarExperience,
  OptionsExperience,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { createDemoPlayer } from '@extension/demo/player'
import { MemoryTabbyProvider } from '@extension/providers/memory'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { assets } from './content'
import { createMarketingDemo, searchExamples } from './demo'
import { useMarketingAppearance } from './MarketingAppearance'
import { ScaledIllustration } from './ScaledIllustration'

const scheduler = {
  now: () => performance.now(),
  schedule: (callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    return () => clearTimeout(timer)
  },
}
export type BrowserIllustrationProps = { capture?: boolean }

export const BrowserIllustration = ({
  capture = false,
}: BrowserIllustrationProps) => {
  const preferences = useMarketingAppearance()
  const [demo] = useState(() => createMarketingDemo('light', preferences))
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
  const mode = capture ? 'scripted' : 'live'
  const [searchOpen, setSearchOpen] = useState(true)
  const [optionsOpen, setOptionsOpen] = useState(false)
  useEffect(() => () => player.dispose(), [player])
  const explore = useCallback((next: 'tabs' | 'search') => {
    setSearchOpen(next === 'search')
    setOptionsOpen(false)
  }, [])
  const host = useMemo(
    () => ({
      openSearch: () => explore('search'),
      openOptions: () => {
        explore('tabs')
        setOptionsOpen(true)
      },
    }),
    [explore],
  )
  const search = useMemo(
    () => ({
      results: searchExamples,
      onTabManager: () => explore('tabs'),
      onOptions: host.openOptions,
    }),
    [explore, host],
  )
  const scriptedSearch =
    demo.frames[playback.step]!.state.experience === 'search'
  const zoom =
    mode === 'scripted'
      ? scriptedSearch
        ? 'search'
        : playback.step > 0 && playback.step < 5
          ? 'tabs'
          : 'overview'
      : 'overview'
  const showSearch = mode === 'scripted' ? scriptedSearch : searchOpen
  const play = () => {
    if (playback.playing) player.pause()
    else player.play()
  }
  const iconRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    let mounted = true
    const align = () => {
      const icon = iconRef.current
      const popup = popupRef.current
      if (!mounted || !icon || !popup) return
      const iconBounds = icon.getBoundingClientRect()
      const popupBounds = popup.getBoundingClientRect()
      if (!popupBounds.width) return
      const x =
        (((iconBounds.left + iconBounds.right) / 2 - popupBounds.left) *
          popup.offsetWidth) /
          popupBounds.width -
        popup.clientLeft
      popup.style.setProperty('--pointer-x', `${x}px`)
    }
    align()
    void document.fonts.ready.then(align)
    const observer = new ResizeObserver(align)
    if (popupRef.current) observer.observe(popupRef.current)
    return () => {
      mounted = false
      observer.disconnect()
    }
  }, [showSearch, zoom])
  return (
    <div
      className="browser-demo"
      data-browser-demo
      data-capture={capture || undefined}
    >
      <ScaledIllustration
        width={900}
        height={600}
        className="browser-illustration"
        stageClassName="browser-stage"
        label="Explore Tabby in Chrome"
        interactive
      >
        <div className="browser-camera" data-zoom={zoom}>
          <div className="browser-tab-strip">
            <div className="browser-window-controls">
              <i />
              <i />
              <i />
            </div>
            <div className="browser-tab">
              Design journal <span>×</span>
            </div>
            <span className="browser-new-tab">+</span>
          </div>
          <div className="browser-toolbar">
            <span className="browser-navigation">
              ← <span>→</span> ↻
            </span>
            <div className="browser-address">
              <span>☷</span> journal.example/design <span>☆</span>
            </div>
            <div className="browser-extensions">
              <span className="browser-other-extension">✓</span>
              <button
                type="button"
                ref={iconRef}
                className="browser-extension-icon"
                aria-label="Search with Tabby"
                aria-expanded={showSearch}
                data-active={showSearch}
                onClick={() => {
                  setSearchOpen(!showSearch)
                }}
              >
                <img src={assets.face} alt="" width="22" height="22" />
              </button>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 5h5V3a2 2 0 0 1 4 0v2h5v5h2a2 2 0 0 1 0 4h-2v5h-5v-2a2 2 0 0 0-4 0v2H4v-5h2a2 2 0 0 0 0-4H4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span>⋮</span>
            </div>
          </div>
          <MemoryTabbyProvider
            resources={{ backend: demo.backend, preferences: demo.preferences }}
            views={demo.views}
            omnibar={search}
            host={host}
          >
            <div className="browser-display">
              <div
                className={`
                  browser-page
                  ${optionsOpen ? 'browser-page--options' : ''}
                `}
              >
                {optionsOpen ? (
                  <TabbySurface className="h-full">
                    <OptionsExperience />
                  </TabbySurface>
                ) : (
                  <>
                    <div className="browser-page-brand">
                      Design journal <span>☰</span>
                    </div>
                    <div className="browser-page-art">
                      <span />
                      <span />
                      <span />
                    </div>
                    <h3>Make room for a new idea.</h3>
                    <p>
                      A few references. A fresh perspective. A project taking
                      shape.
                    </p>
                    <div className="browser-page-rule" />
                    <div className="browser-page-rule" />
                    <div className="browser-page-rule" />
                  </>
                )}
              </div>
              <div className="browser-side-panel">
                <div className="browser-panel-title">
                  <img src={assets.face} width="18" height="18" alt="" />
                  Tabby <span>×</span>
                </div>
                <TabbySurface
                  inputMode={mode}
                  motion="system"
                  className="browser-manager-surface"
                >
                  <TabManagerExperience focusOnMount={false} />
                </TabbySurface>
              </div>
              {showSearch && (
                <div ref={popupRef} className="browser-search-popup">
                  <span className="browser-search-pointer" aria-hidden="true" />
                  <TabbySurface
                    inputMode={mode}
                    motion="system"
                    className="browser-search-surface"
                  >
                    <OmnibarExperience
                      onDismiss={() => {
                        setSearchOpen(false)
                      }}
                    />
                  </TabbySurface>
                </div>
              )}
            </div>
          </MemoryTabbyProvider>
        </div>
      </ScaledIllustration>
      {capture && (
        <>
          <button type="button" hidden onClick={play}>
            {playback.playing
              ? 'Pause tour'
              : playback.time === playback.duration
                ? 'Replay tour'
                : 'Play tour'}
          </button>
          <p className="browser-demo-caption" hidden>
            {playback.title}
          </p>
        </>
      )}
    </div>
  )
}
