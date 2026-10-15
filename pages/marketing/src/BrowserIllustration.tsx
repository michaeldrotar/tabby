import {
  OmnibarExperience,
  TabbySurface,
  TabManagerExperience,
} from '@extension/app'
import { MemoryTabbyProvider } from '@extension/providers/memory'
import { useLayoutEffect, useRef, useState } from 'react'
import { assets } from './content'
import { createMarketingDemo, searchExamples } from './demo'
import { ScaledIllustration } from './ScaledIllustration'

const illustrationSearch = { results: searchExamples }

export const BrowserIllustration = () => {
  const [demo] = useState(() => createMarketingDemo('light'))
  const iconRef = useRef<HTMLSpanElement>(null)
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
  }, [])
  return (
    <ScaledIllustration
      width={900}
      height={600}
      className="browser-illustration"
      stageClassName="browser-stage"
      label="Chrome showing Tabby’s tab manager on the left and search beneath the Tabby extension icon in the toolbar"
    >
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
          <span
            ref={iconRef}
            className="browser-extension-icon"
            data-active="true"
          >
            <img src={assets.face} alt="" width="22" height="22" />
          </span>
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
        omnibar={illustrationSearch}
      >
        <div className="browser-display">
          <div className="browser-page">
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
              A few references. A fresh perspective. A project taking shape.
            </p>
            <div className="browser-page-rule" />
            <div className="browser-page-rule" />
            <div className="browser-page-rule" />
          </div>
          <div className="browser-side-panel">
            <div className="browser-panel-title">
              <img src={assets.face} width="18" height="18" alt="" />
              Tabby <span>×</span>
            </div>
            <TabbySurface
              inputMode="static"
              motion="reduced"
              className="browser-manager-surface"
            >
              <TabManagerExperience focusOnMount={false} />
            </TabbySurface>
          </div>
          <div ref={popupRef} className="browser-search-popup">
            <span className="browser-search-pointer" aria-hidden="true" />
            <TabbySurface
              inputMode="static"
              motion="reduced"
              className="browser-search-surface"
            >
              <OmnibarExperience onDismiss={() => {}} />
            </TabbySurface>
          </div>
        </div>
      </MemoryTabbyProvider>
    </ScaledIllustration>
  )
}
