import { useLayoutEffect, useRef, useState } from 'react'
import { homeFeatures } from './content'
import {
  BrowserIllustration,
  FeatureIllustration,
  ProductDemo,
} from './DemoLoader'
import { MarketingAppearanceProvider } from './MarketingAppearance'
import { BannerCat, WalkingPaws } from './ScrollDecorations'
import { Footer, Install, SiteHeader } from './SiteChrome'
import { useIdleCue } from './useIdleCue'
import { usePageAnchor } from './usePageAnchor'
import type { RefObject } from 'react'

type ShowcaseControls = {
  onShowcase: (watching: boolean) => void
}

const TourVideo = ({
  videoRef,
}: {
  videoRef?: RefObject<HTMLVideoElement | null>
}) => (
  <video
    ref={videoRef}
    controls
    muted
    playsInline
    preload="none"
    poster={`${import.meta.env.BASE_URL}media/tour-poster.png`}
    aria-label="Tabby product tour with sample tabs"
  >
    <source
      src={`${import.meta.env.BASE_URL}media/tabby-tour.webm`}
      type="video/webm"
    />
    <track
      kind="captions"
      src={`${import.meta.env.BASE_URL}media/tabby-tour.vtt`}
      srcLang="en"
      label="English"
      default
    />
  </video>
)

const showcaseLabels = { video: 'Or watch my video', demo: 'Or try the demo' }

const ShowcaseIcon = ({ video = true }: { video?: boolean }) => (
  <svg
    className="showcase-icon"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    {video ? (
      <path
        d="m9 5 11 7-11 7V5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="m9 5-5 5 5 5m-5-5h10a6 6 0 0 1 6 6v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
)

const HeroShowcase = ({
  watching,
  onShowcase,
  videoRef,
}: {
  watching: boolean
  onShowcase: (watching: boolean) => void
  videoRef: RefObject<HTMLVideoElement | null>
}) => {
  const showcaseRef = useRef<HTMLDivElement>(null)
  const [shaking, setShaking] = useState(false)
  const previousWatching = useRef(watching)
  const requestShake = useIdleCue(showcaseRef, {
    delay: 7000,
    interval: 6000,
    group: 'hero',
    duration: 650,
    pauseOnFocus: false,
    onCue: () => setShaking(true),
    onCancel: () => setShaking(false),
  })
  useLayoutEffect(() => {
    if (previousWatching.current === watching) return
    previousWatching.current = watching
    requestShake(820)
  }, [watching, requestShake])
  return (
    <div
      ref={showcaseRef}
      id="hero-showcase"
      className="hero-showcase"
      data-watching={watching}
      data-shaking={shaking}
    >
      <div id="hero-showcase-content" className="showcase-rotor">
        {[false, true].map((video) => (
          <div
            key={String(video)}
            className={`
              showcase-face
              ${video ? 'showcase-back' : ''}
            `}
            aria-hidden={watching !== video}
            inert={watching !== video}
          >
            <div className="showcase-sign">
              <h2>
                <span
                  className="showcase-sign-label"
                  onAnimationEnd={() => setShaking(false)}
                >
                  {video ? 'Watch it' : 'Try it'}
                </span>
              </h2>
              <svg viewBox="0 0 80 130" fill="none" aria-hidden="true">
                <path
                  d="M8 12C72 2 73 68 35 113M31 90l4 23 24-6"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="showcase-content">
              {video ? (
                <div className="showcase-video">
                  <TourVideo videoRef={videoRef} />
                  <p>A quick tour with music. Captions available.</p>
                </div>
              ) : (
                <ProductDemo separated />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="showcase-toggle-entry">
        <button
          className="showcase-toggle showcase-rotor"
          type="button"
          aria-controls="hero-showcase-content"
          aria-label={watching ? showcaseLabels.demo : showcaseLabels.video}
          onClick={() => onShowcase(!watching)}
        >
          <span
            className="showcase-face showcase-action"
            aria-hidden={watching}
          >
            <ShowcaseIcon />
            {showcaseLabels.video}
          </span>
          <span
            className="showcase-face showcase-back showcase-action"
            aria-hidden={!watching}
          >
            <ShowcaseIcon video={false} />
            {showcaseLabels.demo}
          </span>
        </button>
      </div>
    </div>
  )
}

const Hero = ({
  onShowcase,
  watching,
  videoRef,
}: ShowcaseControls & {
  watching: boolean
  videoRef: RefObject<HTMLVideoElement | null>
}) => (
  <section className="hero home-hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="intro-note">A little order for all your tabs</p>
      <h1 id="hero-title">
        Big tab energy.
        <br />
        Little tab chaos.
      </h1>
      <p>
        I made Tabby to help you keep every Chrome window in view and find the
        page you need across tabs, bookmarks, history, and recently closed
        pages.
      </p>
      <div className="hero-actions">
        <Install />
        <a className="secondary-action" href="/whats-new">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect
              x="4"
              y="3"
              width="16"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8 7h8M8 11h8M8 15h5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          What’s New
        </a>
      </div>
      <p className="privacy-note">
        Tabby doesn’t send any of your data to anyone,{' '}
        <strong>not even me.</strong>
      </p>
    </div>
    <HeroShowcase
      watching={watching}
      onShowcase={onShowcase}
      videoRef={videoRef}
    />
  </section>
)

const BrowserOverview = () => (
  <section
    className="browser-overview section-wrap"
    aria-labelledby="browser-title"
  >
    <div className="section-heading">
      <h2 id="browser-title">Here’s Tabby in Chrome.</h2>
      <p>
        Keep your tabs beside the page you’re on. Search is right there in
        Chrome’s toolbar.
      </p>
    </div>
    <BrowserIllustration />
  </section>
)

const HomeFeatures = () => (
  <div id="features" className="home-features section-wrap">
    {homeFeatures.map((item) => (
      <section
        key={item.id}
        id={item.id}
        className={`
          home-feature
          home-feature--${item.id}
        `}
        aria-labelledby={`${item.id}-title`}
      >
        <div className="feature-copy">
          <h2 id={`${item.id}-title`}>{item.label}</h2>
          <p>{item.description}</p>
        </div>
        <FeatureIllustration feature={item.id} />
      </section>
    ))}
  </div>
)

const Privacy = () => (
  <section className="privacy-section section-wrap">
    <WalkingPaws />
    <div>
      <h2>Your browser is your business.</h2>
      <p>
        I don’t receive any of your data. Tabby searches right in your browser.
        If you choose Search Google, that query goes to Google.
      </p>
      <a
        className="text-link"
        href="https://github.com/michaeldrotar/tabby/blob/main/PRIVACY.md"
        target="_blank"
        rel="noreferrer"
      >
        Read my privacy policy
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  </section>
)

export const Landing = () => {
  const [watching, setWatching] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  usePageAnchor()
  const onShowcase = (next: boolean) => {
    if (!next) videoRef.current?.pause()
    setWatching(next)
  }
  return (
    <MarketingAppearanceProvider>
      <div className="site site--home">
        <a className="skip-link" href="#features">
          Skip to features
        </a>
        <SiteHeader />
        <main>
          <Hero
            onShowcase={onShowcase}
            watching={watching}
            videoRef={videoRef}
          />
          <div className="promise-strip">
            <span>Find that page.</span>
            <span>Gather your projects.</span>
            <span>Make yourself at home.</span>
            <BannerCat />
          </div>
          <BrowserOverview />
          <HomeFeatures />
          <Privacy />
        </main>
        <Footer />
      </div>
    </MarketingAppearanceProvider>
  )
}
