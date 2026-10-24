import { Pause, Play } from 'lucide-react'
import { createContext, useContext, useMemo, useState } from 'react'
import { useSurface } from './Surface'
import { useShouldReduceMotion } from './useShouldReduceMotion'
import type { ThemeAppearance } from '@extension/core'
import type { ReactNode } from 'react'

const SummerContext = createContext<{
  theme: ThemeAppearance | undefined
  paused: boolean
  toggle: () => void
} | null>(null)

export const SummerThemeProvider = ({
  theme,
  children,
}: {
  theme?: ThemeAppearance
  children: ReactNode
}) => {
  const [paused, setPaused] = useState(false)
  const value = useMemo(
    () => ({
      theme,
      paused,
      toggle: () => setPaused((value) => !value),
    }),
    [theme, paused],
  )
  return (
    <SummerContext.Provider value={value}>{children}</SummerContext.Provider>
  )
}

const useSummer = () => {
  const summer = useContext(SummerContext)
  const surface = useSurface()
  const reduced = useShouldReduceMotion()
  return {
    ...summer,
    still: summer?.paused || reduced !== false,
    interactive: surface?.inputMode === 'live' && reduced === false,
  }
}

export const SummerMotionControl = ({
  nightOnly = false,
  active = true,
}: {
  nightOnly?: boolean
  active?: boolean
}) => {
  const summer = useSummer()
  if (
    !summer.theme ||
    !summer.interactive ||
    !active ||
    (nightOnly && summer.theme !== 'dark')
  )
    return null
  const label = summer.paused
    ? 'Play summer animations'
    : 'Pause summer animations'
  return (
    <button
      className="summer-motion-control"
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={summer.paused}
      onClick={summer.toggle}
    >
      {summer.paused ? (
        <Play size={14} aria-hidden="true" />
      ) : (
        <Pause size={14} aria-hidden="true" />
      )}
    </button>
  )
}

const stars = Array.from({ length: 8 }, (_, index) => ({
  left: `${(index * 37 + 9) % 100}%`,
  top: `${(index * 19 + 12) % 90}%`,
  animationDelay: `${-index * 0.7}s`,
}))

export const SummerDetails = ({
  place,
}: {
  place: 'manager' | 'options' | 'search'
}) => {
  const summer = useSummer()
  if (!summer.theme) return null
  return (
    <div
      data-summer-details={place}
      data-appearance={summer.theme}
      data-paused={summer.still}
      aria-hidden="true"
    >
      {summer.theme === 'dark' ? (
        <>
          {place !== 'search' && (
            <img
              className="summer-atmosphere"
              src="/themes/summer/night.jpg"
              alt=""
            />
          )}
          <div className="summer-stars">
            {stars.map((style, index) => (
              <i key={index} style={style} />
            ))}
          </div>
          <svg className="summer-constellation" viewBox="0 0 180 120">
            <path d="m16 84 42-47 46 20 48-36m-48 36 24 44" />
            {[
              [16, 84],
              [58, 37],
              [104, 57],
              [152, 21],
              [128, 101],
            ].map(([cx, cy], index) => (
              <circle key={index} cx={cx} cy={cy} r="1.7" />
            ))}
          </svg>
          <i className="summer-meteor" />
        </>
      ) : (
        <>
          {place !== 'search' && (
            <img
              className="summer-atmosphere summer-atmosphere-wide"
              src="/themes/summer/day.jpg"
              alt=""
            />
          )}
          {place === 'manager' && (
            <img
              className="summer-atmosphere summer-atmosphere-portrait"
              src="/themes/summer/day-sky.jpg"
              alt=""
            />
          )}
          {place === 'search' && (
            <img
              className="summer-treat"
              src="/themes/summer/ice-cream.png"
              alt=""
            />
          )}
        </>
      )}
    </div>
  )
}

export const SummerToolbarArt = () => {
  const summer = useSummer()
  return summer.theme === 'light' ? (
    <img
      className="summer-toolbar-ball"
      data-paused={summer.still}
      src="/themes/summer/ball.png"
      alt=""
      aria-hidden="true"
    />
  ) : null
}
