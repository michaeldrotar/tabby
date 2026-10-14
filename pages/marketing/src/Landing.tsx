import { useRef, useState } from 'react'
import { assets, features, storeUrl } from './content'
import { ProductDemo } from './DemoLoader'
import type { Design } from './content'
import type { RefObject } from 'react'

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
const Brand = () => (
  <a className="brand" href="#top" aria-label="Tabby home">
    <img src={assets.face} width="45" height="45" alt="" />
    <span>Tabby</span>
  </a>
)

const Header = () => (
  <header className="site-header">
    <Brand />
    <nav aria-label="Main navigation">
      <a href="#features">What it does</a>
      <a href="#try">Try Tabby</a>
      <a href="#watch">Watch it work</a>
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

const HeroShowcase = () => {
  const [watching, setWatching] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  return (
    <div className="hero-showcase" data-watching={watching}>
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
        aria-label={watching ? 'Or try our demo' : 'Or watch our video'}
        onClick={() => {
          videoRef.current?.pause()
          setWatching((value) => !value)
        }}
      >
        <span className="showcase-rotor" aria-hidden="true">
          <span className="showcase-face" aria-hidden={watching}>
            Or watch our video <span>▷</span>
          </span>
          <span className="showcase-face showcase-back" aria-hidden={!watching}>
            Or try our demo <span>↩</span>
          </span>
        </span>
      </button>
    </div>
  )
}

const CompanionHero = ({ homepage = false }: { homepage?: boolean }) => (
  <section className="hero companion-hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <p className="intro-note">
        <span aria-hidden="true">✳</span> A little order for all your tabs
      </p>
      <h1 id="hero-title">
        Big tab energy.
        <br />
        Little tab chaos.
      </h1>
      <p>
        You have places to be. Tabby brings your tabs together and helps you
        find your way back to anything.
      </p>
      <div className="hero-actions">
        <Install />
        <a className="text-link" href="#watch">
          <span aria-hidden="true">▷</span> Meet your new tab companion
        </a>
      </div>
      <p className="small-note">
        Made for Chrome. Your browsing data stays with you.
      </p>
    </div>
    {homepage ? (
      <HeroShowcase />
    ) : (
      <div className="hero-product">
        <div className="tab-sticker sticker-work">
          Design project <span>3 tabs</span>
        </div>
        <ProductDemo />
        <div className="tab-sticker sticker-life">
          Weekend plans <span>3 tabs</span>
        </div>
      </div>
    )}
  </section>
)

const FocusHero = () => (
  <section className="hero focus-hero" aria-labelledby="hero-title">
    <div className="focus-hero-copy">
      <p className="intro-note">A shortcut back to what matters</p>
      <h1 id="hero-title">
        Less searching.
        <br />
        More doing.
      </h1>
      <p>
        Your tabs, bookmarks, and history. Your next move.
        <br className="desktop-break" /> All within reach, with Tabby for
        Chrome.
      </p>
      <div className="hero-actions">
        <Install />
        <a className="text-link" href="#try">
          Try a search below <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
    <div className="focus-search">
      <ProductDemo theme="dark" initialExperience="search" />
      <div className="shortcut-tag">
        <kbd>⌘ E</kbd>
        <span>Mac</span>
        <kbd>Alt E</kbd>
        <span>Windows & Linux</span>
      </div>
    </div>
    <div className="focus-benefits">
      <p>
        <span>One place</span>All your open windows
      </p>
      <p>
        <span>One search</span>Five ways to find a page
      </p>
      <p>
        <span>One selection</span>A whole batch of actions
      </p>
    </div>
  </section>
)

const PlaygroundHero = () => (
  <section className="hero playground-hero" aria-labelledby="hero-title">
    <div className="play-hero-top">
      <div>
        <p className="intro-note">For the beautifully over-tabbed</p>
        <h1 id="hero-title">
          Go on.
          <br />
          Open another tab.
        </h1>
      </div>
      <div className="cat-stamp">
        <img src={assets.face} alt="Tabby's friendly orange cat" />
        <span>We’ll keep an eye on them.</span>
      </div>
    </div>
    <div className="play-hero-bottom">
      <p>
        A project here. A rabbit hole there.
        <br />
        Tabby makes room for it all.
        <br />
        Find it. Group it. Make it yours.
      </p>
      <div className="hero-actions">
        <Install />
        <a className="text-link" href="#try">
          Let’s play with some tabs <span aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
    <div className="play-tab-strip" aria-hidden="true">
      <span>
        Design project <b>×</b>
      </span>
      <span>
        Weekend plans <b>×</b>
      </span>
      <span>
        Reading rabbit hole <b>×</b>
      </span>
      <span>
        Something good <b>＋</b>
      </span>
    </div>
  </section>
)

const FeatureExplorer = ({ design }: { design: Design }) => {
  const [active, setActive] = useState(0)
  const feature = features[active]!
  if (design === 'playground')
    return (
      <section
        id="features"
        className="play-features"
        aria-label="Tabby features"
      >
        {features.map((item, index) => (
          <article
            className={`
              play-feature
              play-feature--${item.id}
            `}
            key={item.id}
          >
            <div className="feature-copy">
              <span className="feature-label">{item.label}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <a className="text-link" href="#try">
                Give it a try <span aria-hidden="true">↗</span>
              </a>
            </div>
            <figure>
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                width="1280"
                height="800"
              />
              <figcaption>{item.detail}</figcaption>
            </figure>
            <span className="play-feature-mark" aria-hidden="true">
              {['⊞', '⌕', '☷', '✳'][index]}
            </span>
          </article>
        ))}
      </section>
    )
  return (
    <section
      id="features"
      className="feature-section section-wrap"
      aria-labelledby="features-title"
    >
      <div className="section-heading">
        <h2 id="features-title">
          {design === 'focus'
            ? 'Everything you need. Within reach.'
            : 'A place for every part of your day.'}
        </h2>
        <p>
          {design === 'focus'
            ? 'Go straight to a page. Put a project together. Keep your browser moving with you.'
            : 'A busy browser can still feel simple. Here’s how Tabby helps.'}
        </p>
      </div>
      <div className="feature-explorer">
        <div
          className="feature-menu"
          role="group"
          aria-label="Explore features"
        >
          {features.map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              <span>{item.label}</span>
              <span aria-hidden="true">{active === index ? '−' : '+'}</span>
              {active === index && (
                <span className="feature-menu-description">
                  {item.description}
                </span>
              )}
            </button>
          ))}
        </div>
        <figure className="feature-image">
          <img
            src={feature.image}
            alt={feature.alt}
            loading="lazy"
            width="1280"
            height="800"
          />
          <figcaption>{feature.detail}</figcaption>
        </figure>
      </div>
    </section>
  )
}

const TrySection = ({
  design,
  homepage,
}: {
  design: Design
  homepage: boolean
}) => (
  <section
    id="try"
    className="try-section section-wrap"
    aria-labelledby="try-title"
  >
    <div className="try-copy">
      <span className="feature-label">Take it for a spin</span>
      <h2 id="try-title">
        A few tabs.
        <br />A little possibility.
      </h2>
      <p>
        No installation needed for this bit. Switch windows, select a few tabs,
        or search for “design.” Then pick a color that feels like home.
      </p>
      <ul>
        <li>Try the window rail to see another part of your day.</li>
        <li>Select tabs and open More actions to work on a batch.</li>
        <li>Switch to Search or Settings to explore your way.</li>
      </ul>
      <p className="sample-note">
        This demo uses sample data. Your browser tabs stay untouched.
      </p>
    </div>
    <ProductDemo
      theme={design === 'focus' ? 'dark' : 'light'}
      showTour={!homepage}
    />
  </section>
)

const WatchSection = ({ homepage }: { homepage: boolean }) => (
  <section
    id="watch"
    className="watch-section section-wrap"
    aria-labelledby="watch-title"
  >
    <div className="section-heading">
      <div>
        <span className="feature-label">A quick look</span>
        <h2 id="watch-title">From scattered to sorted.</h2>
      </div>
      <p>
        See a few tabs become a project, find a page, and change the mood.
        {!homepage && ' Or play the guided tour in the demo above.'}
      </p>
    </div>
    <figure className="video-showcase">
      <TourVideo />
      <figcaption>
        A tour with music, using sample browser data. Captions available.
      </figcaption>
    </figure>
  </section>
)

const Privacy = () => (
  <section className="privacy-section section-wrap">
    <img src={assets.paws} alt="" width="100" height="100" loading="lazy" />
    <div>
      <h2>Your browser is your business.</h2>
      <p>
        Searches across your tabs, bookmarks, and history happen on your device.
        The developer receives none of your browsing data or saved preferences.
        Choosing Search Google sends that query to Google.
      </p>
      <a
        className="text-link"
        href="https://github.com/michaeldrotar/tabby/blob/main/PRIVACY.md"
        target="_blank"
        rel="noreferrer"
      >
        Read the privacy policy <span aria-hidden="true">↗</span>
      </a>
    </div>
  </section>
)

const Footer = ({
  design,
  homepage,
}: {
  design: Design
  homepage: boolean
}) => (
  <>
    <section className="closing section-wrap">
      <img src={assets.face} width="80" height="80" alt="" />
      <h2>
        {design === 'playground'
          ? 'A good home for your tabs.'
          : design === 'focus'
            ? 'Find your focus. Keep your tabs.'
            : 'Your tabs have a new companion.'}
      </h2>
      <p>Add Tabby to Chrome and make a little room for your day.</p>
      <Install />
    </section>
    <footer className="site-footer">
      <Brand />
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
      <span>Made for curious people.</span>
    </footer>
    <nav className="design-switch" aria-label="Design previews">
      <span>Explore the designs</span>
      {(['companion', 'focus', 'playground'] as const).map((item) => (
        <a
          key={item}
          href={`${import.meta.env.BASE_URL}${item}`}
          aria-current={!homepage && design === item ? 'page' : undefined}
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </a>
      ))}
    </nav>
  </>
)

export const Landing = ({
  design,
  homepage = false,
}: {
  design: Design
  homepage?: boolean
}) => (
  <div
    id="top"
    className={`
      site
      site--${design}
      ${homepage ? 'site--home' : ''}
    `}
  >
    <a className="skip-link" href="#features">
      Skip to features
    </a>
    <Header />
    <main>
      {design === 'companion' ? (
        <CompanionHero homepage={homepage} />
      ) : design === 'focus' ? (
        <FocusHero />
      ) : (
        <PlaygroundHero />
      )}
      {design === 'companion' && (
        <div className="promise-strip">
          <span>Find that page.</span>
          <span>Gather your projects.</span>
          <span>Make yourself at home.</span>
          <img src={assets.face} alt="" width="38" height="38" />
        </div>
      )}
      <FeatureExplorer design={design} />
      <TrySection design={design} homepage={homepage} />
      <WatchSection homepage={homepage} />
      <Privacy />
    </main>
    <Footer design={design} homepage={homepage} />
  </div>
)
