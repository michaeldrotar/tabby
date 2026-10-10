import { useLayoutEffect, useRef } from 'react'
import { useSurface } from '../Surface'
import { cn } from '../utils/cn'
import { OptionsAppearance } from './OptionsAppearance'
import {
  OptionsHeader,
  OptionsReset,
  OptionsSidePanelSettings,
} from './OptionsHostSections'
import { OptionsManagerPreferences } from './OptionsManagerPreferences'
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
export type OptionsControlBindings = (control: OptionsControl) => {
  open: boolean | undefined
  onOpenChange: (open: boolean) => void
}
export const Options = (props: OptionsProps) => {
  const { openControl, onOpenControlChange, scrollTop, onScrollChange, error } =
    props
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (
      root.current &&
      scrollTop !== undefined &&
      Math.abs(root.current.scrollTop - scrollTop) > 1
    )
      root.current.scrollTop = scrollTop
  }, [scrollTop])
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
      <div className="mx-auto max-w-2xl px-6 py-10">
        {error && (
          <p role="alert" className="mb-4 rounded border border-red-500 p-3">
            {error}
          </p>
        )}
        <OptionsHeader logoUrl={props.logoUrl} />
        <OptionsAppearance
          preferences={props.preferences}
          activeThemeMode={props.activeThemeMode}
          onPreferenceChange={props.onPreferenceChange}
          randomizeColors={props.randomizeColors}
          controlProps={controlProps}
        />
        <OptionsManagerPreferences
          preferences={props.preferences}
          onPreferenceChange={props.onPreferenceChange}
          controlProps={controlProps}
        />
        <OptionsShortcuts
          isMac={props.isMac}
          shortcutRows={props.shortcutRows}
          shortcutsLoading={props.shortcutsLoading}
          openShortcutsSettings={props.openShortcutsSettings}
        />
        <OptionsSidePanelSettings
          openSidePanelSettings={props.openSidePanelSettings}
        />
        <OptionsReset resetPreferences={props.resetPreferences} />
      </div>
    </div>
  )
}
