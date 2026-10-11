import './marketing.css'
import {
  OmnibarExperience,
  OptionsExperience,
  TabbyProvider,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { useStore } from 'zustand'
import { createShowcase, storeUrl } from './showcase'
import type { Showcase } from './showcase'

const features = [
  {
    id: 'manage',
    number: '01',
    label: 'Manage your tabs',
    product: 'manager',
    title: 'Everything open. Everything in view.',
    description:
      'A dozen tabs or a few different windows: see where everything lives without squinting at a crowded tab strip.',
    details: [
      'Switch between windows from one side panel.',
      'Keep related tabs together in named, colored groups.',
      'Pin the essentials and spot tabs playing audio.',
    ],
    hint: 'Try switching windows, opening a group, or selecting a tab.',
  },
  {
    id: 'search',
    number: '02',
    label: 'Find anything',
    product: 'search',
    title: 'You remember the idea. Tabby finds the page.',
    description:
      'That article, the project brief, the tab you just closed. Search your tabs, groups, bookmarks, and history in one place.',
    details: [
      'Jump straight to an open tab.',
      'Rediscover bookmarks and recently visited pages.',
      'Restore a recently closed tab from search.',
    ],
    hint: 'Try searching “design”, “coffee”, or “Copenhagen”.',
  },
  {
    id: 'bulk',
    number: '03',
    label: 'Do more at once',
    product: 'manager',
    title: 'One selection. A much shorter to-do list.',
    description:
      'Done with a rabbit hole? Select a few tabs, a whole group, or multiple windows, then take care of them together.',
    details: [
      'Close, pin, mute, or reload a batch of tabs.',
      'Move tabs to another window or into a group.',
      'Discard inactive tabs; Chrome reloads them when needed.',
    ],
    hint: 'Use Shift-click to select a range, then open Actions.',
  },
  {
    id: 'customize',
    number: '04',
    label: 'Make it yours',
    product: 'options',
    title: 'A little personality for your everyday browser.',
    description:
      'Quiet neutrals or a pop of color. Light, dark, or your system theme. Make Tabby feel like a natural part of your workspace.',
    details: [
      'Choose background, text, and accent colors.',
      'Set the compact window layout you prefer.',
      'Assign your own keyboard shortcuts in Chrome.',
    ],
    hint: 'Change a color or theme, then return to Manage your tabs.',
  },
] as const

const ChromeIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M12 8h9M8.5 14l-4.8-8M14 15.5l-4.5 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
)

const InstallLink = ({ className = '' }: { className?: string }) => (
  <a
    className={`
      site-button install
      ${className}
    `}
    href={storeUrl}
    target="_blank"
    rel="noreferrer"
  >
    <ChromeIcon /> Add Tabby to Chrome <span aria-hidden="true">↗</span>
  </a>
)

const Brand = () => (
  <a className="brand" href="#top" aria-label="Tabby home">
    <img src="/tabby-face.png" width="38" height="38" alt="" />
    <span>
      tabby<span className="brand-dot">.</span>
    </span>
  </a>
)

const ProductDemo = ({
  showcase,
  scripted = false,
}: {
  showcase: Showcase
  scripted?: boolean
}) => {
  const navigation = useStore(showcase.navigation)
  const playback = useSyncExternalStore(
    showcase.player.subscribe,
    showcase.player.getSnapshot,
    showcase.player.getSnapshot,
  )
  return (
    <TabbyProvider {...showcase.resources}>
      <TabbySurface
        inputMode={scripted ? 'scripted' : 'live'}
        motion={scripted && !playback.playing ? 'reduced' : 'system'}
      >
        {navigation.product === 'manager' && (
          <TabManagerExperience
            controller={showcase.controller}
            focusOnMount={false}
          />
        )}
        {navigation.product === 'search' && (
          <OmnibarExperience
            className="h-full"
            onDismiss={() => {
              if (showcase.navigation.getState().product === 'search')
                showcase.open('manager')
            }}
          />
        )}
        {navigation.product === 'options' && <OptionsExperience />}
      </TabbySurface>
    </TabbyProvider>
  )
}

const Transport = ({
  showcase,
  onPlay,
}: {
  showcase: Showcase
  onPlay: () => void
}) => {
  const playback = useSyncExternalStore(
    showcase.player.subscribe,
    showcase.player.getSnapshot,
    showcase.player.getSnapshot,
  )
  return (
    <div className="showcase-transport">
      <div className="transport-actions">
        <button
          className="small-button"
          onClick={() =>
            playback.playing ? showcase.player.pause() : onPlay()
          }
        >
          <span aria-hidden="true">{playback.playing ? 'Ⅱ' : '▶'}</span>{' '}
          {playback.playing ? 'Pause showcase' : 'Play showcase'}
        </button>
        <button className="text-button" onClick={showcase.reset}>
          Rewind
        </button>
        <span className="time-label">
          {Math.floor(playback.time / 1000)} / 14s
        </span>
      </div>
      <input
        aria-label="Showcase progress"
        type="range"
        min="0"
        max={playback.duration}
        step="100"
        value={playback.time}
        onChange={(event) => showcase.player.seek(Number(event.target.value))}
      />
      <p
        className="showcase-caption"
        aria-live={playback.playing ? 'off' : 'polite'}
      >
        {playback.title}
      </p>
    </div>
  )
}

const InteractiveDemo = ({ showcase }: { showcase: Showcase }) => {
  const [selected, setSelected] = useState(0)
  const [scripted, setScripted] = useState(false)
  const navigation = useStore(showcase.navigation)
  const feature = features[selected]!
  return (
    <section
      className="demo-section section-wrap"
      id="try"
      aria-labelledby="demo-heading"
    >
      <div className="section-heading">
        <p className="eyebrow">A calmer browser starts here</p>
        <h2 className="section-title" id="demo-heading">
          Get a feel for it.
        </h2>
        <p className="section-description">
          Click around. These are sample tabs, so you can make yourself at home.
        </p>
      </div>
      <div className="demo-grid">
        <div className="demo-copy">
          <nav className="feature-nav" aria-label="Explore Tabby features">
            {features.map((item, index) => (
              <button
                key={item.id}
                aria-pressed={selected === index && !scripted}
                onClick={() => {
                  showcase.player.pause()
                  if (scripted) showcase.reset()
                  setScripted(false)
                  setSelected(index)
                  showcase.open(item.product)
                  if (item.id === 'bulk')
                    void showcase.controller.dispatch({
                      type: 'select-item',
                      item: { type: 'tab', id: 5 },
                    })
                }}
              >
                <span>{item.number}</span>
                {item.label}
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </nav>
          <h3 className="feature-title">{feature.title}</h3>
          <p className="feature-description">{feature.description}</p>
          <ul className="feature-details">
            {feature.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p className="demo-hint">
            <span aria-hidden="true">↳</span>{' '}
            {scripted
              ? 'Watch the guided showcase, or pick a feature to try it yourself.'
              : feature.hint}
          </p>
          <div className="demo-tools">
            <button
              className="small-button"
              onClick={() => {
                showcase.reset()
                setScripted(true)
                showcase.player.play()
              }}
            >
              ▶ Watch the showcase
            </button>
            <button
              className="text-button"
              onClick={() => {
                showcase.reset()
                setScripted(false)
                setSelected(0)
              }}
            >
              Reset demo
            </button>
          </div>
        </div>
        <div className="demo-window">
          <div className="window-top">
            <span className="window-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              Tabby /{' '}
              {navigation.product === 'manager'
                ? 'Tab Manager'
                : navigation.product === 'search'
                  ? 'Search'
                  : 'Your preferences'}
            </span>
            <span className="sample-label">Sample browser</span>
          </div>
          <div className="demo-product" aria-label="Interactive Tabby demo">
            <ProductDemo showcase={showcase} scripted={scripted} />
          </div>
          {scripted ? (
            <Transport
              showcase={showcase}
              onPlay={() => showcase.player.play()}
            />
          ) : (
            <p className="demo-footnote">
              Your actual tabs stay right where they are.
            </p>
          )}
          {navigation.notice && (
            <p className="demo-notice" role="status">
              {navigation.notice}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

const Marketing = ({ showcase }: { showcase: Showcase }) => (
  <div className="marketing" id="top">
    <a className="skip-link" href="#main">
      Skip to content
    </a>
    <header className="site-header section-wrap">
      <Brand />
      <nav className="site-nav" aria-label="Main navigation">
        <a href="#features">Why Tabby</a>
        <a href="#watch">See it in action</a>
        <a href="#try">Try it out</a>
      </nav>
      <InstallLink className="header-install" />
    </header>
    <main id="main">
      <section className="hero section-wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> Your cat-friendly tab manager
          </p>
          <h1 className="hero-title" id="hero-title">
            Less tab hunting.
            <br />
            <em>More doing.</em>
          </h1>
          <p className="hero-description">
            Find the page you need. Tidy the rest.
            <br />
            Tabby brings a little order to your browser, so you can get back to
            what matters.
          </p>
          <div className="hero-actions">
            <InstallLink />
            <a className="watch-link" href="#watch">
              <span className="play-circle" aria-hidden="true">
                ▶
              </span>{' '}
              Meet Tabby in 14 seconds
            </a>
          </div>
          <p className="hero-note">Made for Chrome. Runs on your device.</p>
        </div>
        <div className="hero-visual">
          <div className="visual-orbit" aria-hidden="true" />
          <div className="hero-product-frame">
            <div className="window-top">
              <span className="window-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>A little room to focus</span>
              <span aria-hidden="true">↗</span>
            </div>
            <img
              className="hero-screenshot"
              src="/media/tab-manager.png"
              width="440"
              height="540"
              alt="Tabby side panel showing pinned Inbox and Calendar tabs, a Design project group, and two browser windows."
              fetchPriority="high"
            />
          </div>
          <span className="hero-sticker">
            <span aria-hidden="true">✦</span> All your tabs.
            <br />A little more zen.
          </span>
          <span className="hero-caption">
            a small sidekick for big tab energy.
          </span>
        </div>
      </section>
      <div className="benefit-strip">
        <div className="section-wrap">
          <span>
            <b aria-hidden="true">⌕</b> Find your way back
          </span>
          <span>
            <b aria-hidden="true">▤</b> Clear the clutter
          </span>
          <span>
            <b aria-hidden="true">✦</b> Stay in your flow
          </span>
        </div>
      </div>
      <section
        className="story-section section-wrap"
        id="features"
        aria-labelledby="story-heading"
      >
        <div className="story-copy">
          <p className="eyebrow">For the “I know it’s open somewhere” days</p>
          <h2 className="section-title" id="story-heading">
            Your browser has a lot going on.
            <br />
            <em>You don’t have to.</em>
          </h2>
          <p className="section-description">
            Work, research, weekend plans. They all end up in tabs. Tabby helps
            you find the right one and keep the rest under control.
          </p>
          <a className="inline-link" href="#try">
            Find your next tab <span aria-hidden="true">↗</span>
          </a>
        </div>
        <figure className="search-figure">
          <div className="search-figure-heading">
            <span className="eyebrow">One search. All the places.</span>
            <span className="shortcut">
              <kbd>Alt / ⌘</kbd>
              <kbd>E</kbd>
            </span>
          </div>
          <img
            src="/media/search.png"
            width="440"
            height="480"
            alt="A search for design finds open tabs, a bookmark, a history item, and a recently closed tab in one list."
            loading="lazy"
          />
          <figcaption>Remember a word. Find the page.</figcaption>
        </figure>
      </section>
      <section
        className="watch-section"
        id="watch"
        aria-labelledby="watch-heading"
      >
        <div className="watch-layout section-wrap">
          <div>
            <p className="eyebrow">Small actions. Big exhale.</p>
            <h2 className="section-title" id="watch-heading">
              From tab overload
              <br />
              to <em>under control.</em>
            </h2>
            <p className="section-description">
              Clear a finished research session in one go. Find your project
              again. Settle into a look that feels like you.
            </p>
            <a className="inline-link" href="#try">
              Then try it yourself <span aria-hidden="true">↗</span>
            </a>
          </div>
          <figure className="video-figure">
            <video
              controls
              playsInline
              preload="none"
              poster="/media/tab-manager.png"
              width="440"
              height="640"
              aria-label="Tabby walkthrough: bulk cleanup, unified search, and a custom dark theme"
            >
              <source src="/media/tabby-tour.mp4" type="video/mp4" />
              <track
                default
                kind="captions"
                src="/media/tabby-tour.vtt"
                srcLang="en"
                label="English"
              />
              Your browser does not support video.{' '}
              <a href="#try">Try the interactive showcase.</a>
            </video>
            <figcaption>
              <span className="video-dot" /> 14 seconds to a calmer browser{' '}
              <span>Sound off. Focus on.</span>
            </figcaption>
          </figure>
        </div>
      </section>
      <InteractiveDemo showcase={showcase} />
      <section
        className="reassurance section-wrap"
        aria-label="Built for everyday browsing"
      >
        <div>
          <span className="reassurance-icon" aria-hidden="true">
            ⌘
          </span>
          <h3>Keep your hands in the flow.</h3>
          <p>
            Open Search with Alt/⌘ + E. Open Tab Manager with Alt/⌘ + Shift + E.
            Make the shortcuts your own in Chrome.
          </p>
        </div>
        <div>
          <span className="reassurance-icon" aria-hidden="true">
            ⌂
          </span>
          <h3>Your browser. Your business.</h3>
          <p>
            Tabby works locally on your device. Your tabs, bookmarks, and
            history are searched right where they live.
          </p>
        </div>
        <div>
          <span className="reassurance-icon" aria-hidden="true">
            ♡
          </span>
          <h3>A sidekick, not another chore.</h3>
          <p>
            Use the side panel when you need a little order. Keep your groups,
            your windows, and your way of working.
          </p>
        </div>
      </section>
      <section
        className="faq-section section-wrap"
        aria-labelledby="faq-heading"
      >
        <h2 className="section-title" id="faq-heading">
          A few things you might wonder.
        </h2>
        <div className="faq-list">
          <details>
            <summary>What can I search with Tabby?</summary>
            <p>
              Open tabs and tab groups, bookmarks, browsing history, and
              recently closed tabs or windows. Type a title, a URL, or something
              you remember about the page.
            </p>
          </details>
          <details>
            <summary>Does the demo change my browser tabs?</summary>
            <p>
              The demo uses sample data. Select, close, move, and customize
              things here freely. Install the extension to use Tabby with your
              own browser.
            </p>
          </details>
          <details>
            <summary>How do I open Tabby after installing?</summary>
            <p>
              Click Tabby in Chrome’s extension toolbar to open Search, or use
              Alt/⌘ + E. Open the Tab Manager side panel with Alt/⌘ + Shift + E.
              If a shortcut is already taken, assign it in Chrome’s Extensions →
              Keyboard shortcuts page.
            </p>
          </details>
        </div>
      </section>
      <section className="closing section-wrap">
        <img
          src="/tabby-face.png"
          width="64"
          height="64"
          alt="Tabby’s cat mascot"
          loading="lazy"
        />
        <p className="eyebrow">Give your tabs a good home</p>
        <h2 className="section-title">
          A little order.
          <br />
          <em>A lot more breathing room.</em>
        </h2>
        <InstallLink />
        <p className="hero-note">Your next focused moment is a tab away.</p>
      </section>
    </main>
    <footer className="site-footer section-wrap">
      <Brand />
      <span>A cat-friendly corner of Chrome.</span>
      <a
        href="https://github.com/michaeldrotar/tabby"
        target="_blank"
        rel="noreferrer"
      >
        Open source <span aria-hidden="true">↗</span>
      </a>
      <a href={storeUrl} target="_blank" rel="noreferrer">
        Chrome Web Store <span aria-hidden="true">↗</span>
      </a>
    </footer>
  </div>
)

const Capture = ({ showcase, kind }: { showcase: Showcase; kind: string }) => {
  useEffect(() => {
    if (kind === 'search') showcase.player.seek(8000)
  }, [showcase, kind])
  return (
    <main className="capture" data-capture={kind}>
      <div className="capture-product">
        <ProductDemo showcase={showcase} scripted />
      </div>
      {kind === 'tour' && (
        <Transport
          showcase={showcase}
          onPlay={() => {
            showcase.player.play()
          }}
        />
      )}
    </main>
  )
}

let disposed = false
let root: ReturnType<typeof createRoot> | undefined
void createShowcase().then((showcase) => {
  if (disposed) {
    showcase.dispose()
    return
  }
  root = createRoot(document.getElementById('root')!)
  const capture = new URLSearchParams(location.search).get('capture')
  root.render(
    capture ? (
      <Capture showcase={showcase} kind={capture} />
    ) : (
      <Marketing showcase={showcase} />
    ),
  )
  import.meta.hot?.dispose(() => showcase.dispose())
})
import.meta.hot?.dispose(() => {
  disposed = true
  root?.unmount()
})
