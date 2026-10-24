import { useRef, useState } from 'react'
import { ClosingCat } from './ClosingCat'
import { assets, storeUrl } from './content'
import { FooterCat } from './FooterCat'
import { useIdleCue } from './useIdleCue'

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
export const Install = ({
  className = '',
  playful = false,
}: {
  className?: string
  playful?: boolean
}) => {
  const installRef = useRef<HTMLAnchorElement>(null)
  const [shaking, setShaking] = useState(false)
  useIdleCue(installRef, {
    enabled: playful,
    delay: 4000,
    interval: Math.round(10000 / 1.5),
    onCue: () => setShaking(true),
    onCancel: () => setShaking(false),
  })
  return (
    <a
      ref={installRef}
      data-shaking={shaking}
      onAnimationEnd={() => setShaking(false)}
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
}
export const Brand = ({ linked = true }: { linked?: boolean }) => {
  const brandRef = useRef<HTMLAnchorElement>(null)
  const [hopping, setHopping] = useState(false)
  useIdleCue(brandRef, {
    delay: 4000,
    interval: 6000,
    group: 'hero',
    duration: 650,
    onCue: () => setHopping(true),
    onCancel: () => setHopping(false),
  })
  const content = (
    <>
      {linked ? (
        <img src={assets.face} width="45" height="45" alt="" />
      ) : (
        <FooterCat />
      )}
      <span className="brand-word">
        {'Tabby'.split('').map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </span>
    </>
  )
  return linked ? (
    <a
      ref={brandRef}
      className="brand"
      href="/"
      aria-label="Tabby home"
      data-hopping={hopping}
      onAnimationEnd={(event) => {
        if ((event.target as HTMLElement).tagName === 'IMG') setHopping(false)
      }}
    >
      {content}
    </a>
  ) : (
    <div className="brand">{content}</div>
  )
}
export const SiteHeader = () => (
  <header className="site-header">
    <Brand />
    <Install />
  </header>
)

export const Footer = ({ closing = true }: { closing?: boolean }) => {
  const companionRef = useRef<HTMLDivElement>(null)
  return (
    <>
      {closing && (
        <section className="closing section-wrap">
          <div ref={companionRef} className="closing-companion">
            <ClosingCat visibilityRef={companionRef} />
            <h2>Your tabs have a new companion.</h2>
          </div>
          <p>Give Tabby a try. I’d love to hear what you think.</p>
          <Install playful />
        </section>
      )}
      <footer className="site-footer">
        <Brand linked={false} />
        <div>
          <a href="/whats-new">Release notes</a>
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
}
