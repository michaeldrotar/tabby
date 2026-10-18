import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import releases from './releases.json'
import { Footer, SiteHeader } from './SiteChrome'
import { usePageAnchor } from './usePageAnchor'
import { useReleaseReader } from './useReleaseReader'
import type { Components } from 'react-markdown'

const headings: Components = {
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  h3: ({ children }) => <h4>{children}</h4>,
}
const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m6 9 6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ReleaseMeta = ({ index }: { index: number }) => {
  const release = releases[index]!
  return (
    <>
      <span className="release-version">{release.version}</span>
      <time dateTime={release.publishedAt}>
        {dateFormat.format(new Date(release.publishedAt))}
      </time>
    </>
  )
}

const VersionList = ({
  id,
  open,
  single,
  selected,
  onSelect,
}: {
  id: string
  open: boolean
  single: boolean
  selected: number
  onSelect: (index: number) => void
}) => (
  <ol id={id} className="release-version-list" data-open={open}>
    {releases.map((release, index) => (
      <li key={release.version}>
        <a
          href={`#${release.version}`}
          aria-current={single && selected === index ? 'true' : undefined}
          onClick={(event) => {
            if (single) event.preventDefault()
            onSelect(index)
          }}
        >
          <span>{release.version}</span>
          {release.title}
        </a>
      </li>
    ))}
  </ol>
)

export const WhatsNew = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStuck, setMenuStuck] = useState(false)
  const menuRef = useRef<HTMLElement>(null)
  const metaRef = useRef<HTMLElement>(null)
  const {
    enabled: single,
    index: releaseIndex,
    select: selectRelease,
    ref: readerRef,
    focusCurrent: focusRelease,
  } = useReleaseReader()
  const activeRelease = releases[releaseIndex] ?? releases[0]!
  usePageAnchor(!single)
  useEffect(() => {
    const menu = single ? metaRef.current! : menuRef.current!
    let frame = 0
    const update = () => {
      const bounds = menu.getBoundingClientRect()
      const style = getComputedStyle(menu)
      const sections = single
        ? []
        : Array.from(
            readerRef.current!.querySelectorAll('article'),
            (article) => article.getBoundingClientRect(),
          )
      const below = innerHeight - bounds.bottom
      const above =
        below < Math.min(180, innerHeight * 0.45) && bounds.top > below
      menu.dataset.placement = above ? 'above' : 'below'
      menu.style.setProperty(
        '--version-list-height',
        `${Math.max(0, above ? bounds.top : below)}px`,
      )
      if (single) return
      const stuck = bounds.top <= parseFloat(style.top) + 1
      if (!stuck) menu.scrollTop = 0
      setMenuStuck(stuck)
      menu
        .querySelectorAll<HTMLAnchorElement>('.release-version-list a')
        .forEach((link, index) => {
          const section = sections[index]!
          const end = sections[index + 1]?.top ?? section.bottom
          const height = end - section.top
          const fraction = (edge: number) =>
            Math.max(0, Math.min(1, (edge - section.top) / height)) * 100
          link.style.setProperty('--visible-from', `${fraction(0)}%`)
          link.style.setProperty('--visible-to', `${fraction(innerHeight)}%`)
        })
    }
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          update()
        })
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [single, menuOpen, readerRef])
  useEffect(() => {
    if (!menuOpen) return
    const picker = metaRef.current
    const dismiss = (event: PointerEvent) => {
      if (!picker?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        picker
          ?.querySelector<HTMLButtonElement>('button')
          ?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])
  useEffect(() => {
    document.title = 'What’s new in Tabby — Release notes'
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        'content',
        'Explore Tabby’s release notes, from the latest improvements to the first release.',
      )
  }, [])
  const choose = (index: number) => {
    if (single) {
      selectRelease(index)
      metaRef.current
        ?.querySelector<HTMLButtonElement>('button')
        ?.focus({ preventScroll: true })
    }
    setMenuOpen(false)
  }
  return (
    <div
      className={`
        site site--releases
        ${single ? 'site--single-release' : ''}
      `}
    >
      <a
        className="skip-link"
        href="#release-history"
        onClick={(event) => {
          if (!single) return
          event.preventDefault()
          focusRelease()
        }}
      >
        Skip to release notes
      </a>
      <SiteHeader />
      <main className="section-wrap">
        <div className="releases-intro">
          <h1>What’s new in Tabby</h1>
          <p>A little more order, one update at a time.</p>
        </div>
        <div className="releases-layout">
          {!single && (
            <nav
              ref={menuRef}
              className="release-index"
              aria-label="Release versions"
              data-stuck={menuStuck}
            >
              <h2>Every update</h2>
              <VersionList
                id="release-version-list"
                open
                single={false}
                selected={releaseIndex}
                onSelect={choose}
              />
            </nav>
          )}
          {single && (
            <nav
              ref={metaRef}
              className="release-meta-picker"
              aria-label="Release versions"
            >
              <button
                className="release-meta release-meta-toggle"
                type="button"
                aria-label="Choose a version"
                aria-expanded={menuOpen}
                aria-controls="release-details-list"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <ReleaseMeta index={releaseIndex} />
                <Chevron />
              </button>
              <VersionList
                id="release-details-list"
                open={menuOpen}
                single
                selected={releaseIndex}
                onSelect={choose}
              />
            </nav>
          )}
          <div
            id="release-history"
            className="release-history"
            ref={readerRef}
            role={single ? 'region' : undefined}
            aria-label={single ? 'Release notes' : undefined}
            aria-roledescription={single ? 'carousel' : undefined}
            tabIndex={single ? 0 : undefined}
          >
            {releases.map((release, index) => (
              <article
                id={release.version}
                key={release.version}
                tabIndex={-1}
                hidden={single && releaseIndex !== index}
                aria-labelledby={`${release.version}-title`}
                aria-roledescription={single ? 'slide' : undefined}
                aria-hidden={
                  single && releaseIndex !== index ? true : undefined
                }
                inert={single && releaseIndex !== index}
              >
                <header>
                  {!single && (
                    <div className="release-meta">
                      <ReleaseMeta index={index} />
                    </div>
                  )}
                  <h2 id={`${release.version}-title`}>{release.title}</h2>
                </header>
                <div className="release-prose">
                  <Markdown components={headings} skipHtml>
                    {release.body
                      .replace(/\r\n/g, '\n')
                      .replace(/^# .+\n+/, '')
                      .replace(
                        /^\*\*(?:Version|Release Date|Published Date):\*\*.*\n?/gim,
                        '',
                      )
                      .trim()}
                  </Markdown>
                </div>
              </article>
            ))}
            {single && (
              <nav
                className="release-pagination"
                aria-label="Adjacent releases"
              >
                {[-1, 1].map((step) => {
                  const release = releases[releaseIndex + step]
                  if (!release) return null
                  return (
                    <a
                      key={step}
                      className={step < 0 ? 'release-newer' : 'release-older'}
                      href={`#${release.version}`}
                      aria-label={`${step < 0 ? 'Newer' : 'Older'} release, ${release.version}`}
                      onClick={(event) => {
                        event.preventDefault()
                        selectRelease(releaseIndex + step)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d={step < 0 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {release.version}
                    </a>
                  )
                })}
              </nav>
            )}
          </div>
          {single && (
            <span className="sr-only" role="status">
              {activeRelease.version}: {activeRelease.title}. {releaseIndex + 1}{' '}
              of {releases.length}.
            </span>
          )}
        </div>
      </main>
      <Footer closing={false} />
    </div>
  )
}
