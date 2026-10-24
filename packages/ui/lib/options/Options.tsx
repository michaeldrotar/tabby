import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useSurface } from '../Surface'
import { cn } from '../utils/cn'
import { OptionsAppearance } from './OptionsAppearance'
import {
  OptionsHeader,
  OptionsReset,
  OptionsSidePanelSettings,
} from './OptionsHostSections'
import { OptionsManagerPreferences } from './OptionsManagerPreferences'
import {
  OptionsSeasonalIcons,
  OptionsSeasonalIconsOverview,
} from './OptionsSeasonalIcons'
import { OptionsShortcuts } from './OptionsShortcuts'
import type { PreferenceState } from '@extension/core'

export type OptionsShortcutView = {
  id: string
  name: string
  description: string
  shortcut?: string
}
export type OptionsControl =
  | 'background'
  | 'foreground'
  | 'accent'
  | 'window-icon'
export type OptionsProps = {
  urlSeasonalIcons?: boolean
  openControl?: OptionsControl | null
  onOpenControlChange?: (control: OptionsControl | null) => void
  scrollTop?: number
  onScrollChange?: (top: number) => void
  preferences: PreferenceState
  activeThemeMode: 'light' | 'dark'
  isMac: boolean
  shortcutRows: readonly OptionsShortcutView[]
  shortcutsLoading?: boolean
  logoUrl: string
  error?: string
  onPreferenceChange: (patch: Partial<PreferenceState>) => void | Promise<void>
  randomizeColors: () => void
  resetPreferences: () => void
  openShortcutsSettings: () => void
  openSidePanelSettings: () => void
}

const SEASONAL_ICONS_HASH = '#seasonal-icons'

const seasonalIconsViewFromHash = () =>
  typeof window !== 'undefined' && window.location.hash === SEASONAL_ICONS_HASH

export type OptionsControlBindings = (control: OptionsControl) => {
  open: boolean | undefined
  onOpenChange: (open: boolean) => void
}
export const Options = (props: OptionsProps) => {
  const { openControl, onOpenControlChange, scrollTop, onScrollChange, error } =
    props
  const urlSeasonalIcons = props.urlSeasonalIcons ?? false
  const root = useRef<HTMLDivElement>(null)
  const [showSeasonalIcons, setShowSeasonalIcons] = useState(
    () => urlSeasonalIcons && seasonalIconsViewFromHash(),
  )
  const resetScroll = useCallback(() => {
    if (root.current) root.current.scrollTop = 0
    if (window.scrollY > 0) window.scrollTo(0, 0)
    onScrollChange?.(0)
  }, [onScrollChange])
  useLayoutEffect(() => {
    if (
      root.current &&
      !showSeasonalIcons &&
      scrollTop !== undefined &&
      Math.abs(root.current.scrollTop - scrollTop) > 1
    )
      root.current.scrollTop = scrollTop
  }, [scrollTop, showSeasonalIcons])
  useEffect(() => {
    if (!urlSeasonalIcons) return
    const syncViewFromHash = () => {
      setShowSeasonalIcons(seasonalIconsViewFromHash())
      resetScroll()
    }
    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [resetScroll, urlSeasonalIcons])

  const openSeasonalIcons = () => {
    setShowSeasonalIcons(true)
    resetScroll()
    if (urlSeasonalIcons && window.location.hash !== SEASONAL_ICONS_HASH)
      window.history.replaceState(null, '', SEASONAL_ICONS_HASH)
  }
  const backToSettings = () => {
    setShowSeasonalIcons(false)
    resetScroll()
    if (urlSeasonalIcons && window.location.hash === SEASONAL_ICONS_HASH)
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      )
  }

  const controlProps: OptionsControlBindings = (control) => ({
    open: openControl === undefined ? undefined : openControl === control,
    onOpenChange: (open) => onOpenControlChange?.(open ? control : null),
  })
  const surface = useSurface()
  const wide = (surface?.width ?? 0) >= 640
  return (
    <div
      ref={root}
      data-options
      data-wide={wide}
      onScroll={(event) => onScrollChange?.(event.currentTarget.scrollTop)}
      className={cn(
        'group/options h-full w-full overflow-auto',
        'bg-background text-foreground',
      )}
    >
      <div
        className={`
          mx-auto max-w-2xl px-4 py-6
          group-data-[wide=true]/options:px-6
          group-data-[wide=true]/options:py-8
        `}
      >
        {error && (
          <p role="alert" className="mb-4 rounded border border-red-500 p-3">
            {error}
          </p>
        )}
        <OptionsHeader logoUrl={props.logoUrl} />
        {showSeasonalIcons ? (
          <>
            <button
              type="button"
              onClick={backToSettings}
              className={cn(
                `
                  text-muted mb-4 flex items-center gap-2 text-sm font-medium
                  transition-colors
                  hover:text-foreground
                  focus-visible:ring-accent focus-visible:outline-none
                  focus-visible:ring-2
                `,
              )}
            >
              <span aria-hidden="true">←</span>
              Back to settings
            </button>
            <OptionsSeasonalIcons
              preferences={props.preferences}
              onPreferenceChange={props.onPreferenceChange}
            />
          </>
        ) : (
          <>
            <OptionsAppearance
              preferences={props.preferences}
              activeThemeMode={props.activeThemeMode}
              onPreferenceChange={props.onPreferenceChange}
              randomizeColors={props.randomizeColors}
            />
            <OptionsManagerPreferences
              preferences={props.preferences}
              onPreferenceChange={props.onPreferenceChange}
              controlProps={controlProps}
            />
            <OptionsSidePanelSettings
              openSidePanelSettings={props.openSidePanelSettings}
            />
            <OptionsShortcuts
              isMac={props.isMac}
              shortcutRows={props.shortcutRows}
              shortcutsLoading={props.shortcutsLoading}
              openShortcutsSettings={props.openShortcutsSettings}
            />
            <OptionsSeasonalIconsOverview
              preferences={props.preferences}
              onPreferenceChange={props.onPreferenceChange}
              onOpen={openSeasonalIcons}
            />
            <OptionsReset resetPreferences={props.resetPreferences} />
          </>
        )}
      </div>
    </div>
  )
}
