import { useLayoutEffect, useRef, useState } from 'react'
import { assets, homeFeatures, storeUrl } from './content'
import {
  BrowserIllustration,
  FeatureIllustration,
  ProductDemo,
} from './DemoLoader'
import type { ReactNode, RefObject } from 'react'

const ChromeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 8h9M8.5 14 4 6m10 10-4 6"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
)
const Install = ({ className = '' }: { className?: string }) => (
  <a
    className={`
      install
      ${className}
    `}
    href={storeUrl}
    target="_blank"
    rel="noreferrer"
  >
    <ChromeIcon />
    Get Tabby for Chrome
  </a>
)
const Brand = ({ linked = true }: { linked?: boolean }) => {
  const content = (
    <>
      <img src={assets.face} width="45" height="45" alt="" />
      <span>Tabby</span>
    </>
  )
  return linked ? (
    <a className="brand" href="#top" aria-label="Tabby home">
      {content}
    </a>
  ) : (
    <div className="brand">{content}</div>
  )
}
type ShowcaseControls = {
  onShowcase: (watching: boolean) => void
}

const ShowcaseLink = ({
  onShowcase,
  watching = false,
  className,
  children,
}: ShowcaseControls & {
  watching?: boolean
  className?: string
  children: ReactNode
}) => (
  <a
    href="#hero-showcase"
    className={className}
    onClick={() => onShowcase(watching)}
  >
    {children}
  </a>
)

const Header = ({ onShowcase }: ShowcaseControls) => (
  <header className="site-header">
    <Brand />
    <nav aria-label="Main navigation">
      <a href="#features">What it does</a>
      <ShowcaseLink onShowcase={onShowcase}>Try Tabby</ShowcaseLink>
      <ShowcaseLink onShowcase={onShowcase} watching>
        Watch it work
      </ShowcaseLink>
    </nav>
    <Install />
  </header>
)

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

const HeroShowcase = ({
  watching,
  onShowcase,
  videoRef,
}: {
  watching: boolean
  onShowcase: (watching: boolean) => void
  videoRef: RefObject<HTMLVideoElement | null>
}) => {
  return (
    <div id="hero-showcase" className="hero-showcase" data-watching={watching}>
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
              <h2>{video ? 'Watch it' : 'Try it'}</h2>
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
                <ProductDemo separated showTour={false} />
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        className="showcase-toggle text-link"
        type="button"
        aria-controls="hero-showcase-content"
        aria-label={watching ? showcaseLabels.demo : showcaseLabels.video}
        onClick={() => onShowcase(!watching)}
      >
        <span className="showcase-rotor" aria-hidden="true">
          <span className="showcase-face" aria-hidden={watching}>
            {showcaseLabels.video} <span>▷</span>
          </span>
          <span className="showcase-face showcase-back" aria-hidden={!watching}>
            {showcaseLabels.demo} <span>↩</span>
          </span>
        </span>
      </button>
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
        <ShowcaseLink className="text-link" onShowcase={onShowcase} watching>
          <span aria-hidden="true">▷</span> Watch my quick tour
        </ShowcaseLink>
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
    <img src={assets.paws} alt="" width="100" height="100" loading="lazy" />
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

const Footer = () => (
  <>
    <section className="closing section-wrap">
      <img src={assets.face} width="80" height="80" alt="" />
      <h2>Your tabs have a new companion.</h2>
      <p>Give Tabby a try. I’d love to hear what you think.</p>
      <Install />
    </section>
    <footer className="site-footer">
      <Brand linked={false} />
      <div>
        <a
          href="https://github.com/michaeldrotar/tabby"
          target="_blank"
          rel="noreferrer"
        >
          Open source
        </a>
        <a
          href="https://github.com/michaeldrotar/tabby/issues"
          target="_blank"
          rel="noreferrer"
        >
          Help & feedback
        </a>
        <a
          href="https://github.com/michaeldrotar/tabby/blob/main/PRIVACY.md"
          target="_blank"
          rel="noreferrer"
        >
          Privacy
        </a>
      </div>
      <span>Made for tab-aholics like me.</span>
    </footer>
  </>
)

export const Landing = () => {
  const [watching, setWatching] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  useLayoutEffect(() => {
    let targetId: string
    try {
      targetId = decodeURIComponent(location.hash.slice(1))
    } catch {
      return
    }
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'instant' })
  }, [])
  const onShowcase = (next: boolean) => {
    if (!next) videoRef.current?.pause()
    setWatching(next)
  }
  return (
    <div id="top" className="site site--home">
      <a className="skip-link" href="#features">
        Skip to features
      </a>
      <Header onShowcase={onShowcase} />
      <main>
        <Hero onShowcase={onShowcase} watching={watching} videoRef={videoRef} />
        <div className="promise-strip">
          <span>Find that page.</span>
          <span>Gather your projects.</span>
          <span>Make yourself at home.</span>
          <img src={assets.face} alt="" width="38" height="38" />
        </div>
        <BrowserOverview />
        <HomeFeatures />
        <Privacy />
      </main>
      <Footer />
    </div>
  )
}
