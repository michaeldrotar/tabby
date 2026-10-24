import { getThemeIconId, getUpcomingSeasonalIcon } from '@extension/core'
import { Options } from '@extension/ui/options/Options'
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { useTabbyResources } from './TabbyProvider'
import { useExperienceClock } from './useExperienceClock'
import type { PreferenceResource, PreferenceState } from '@extension/core'
import type { OptionsResource } from '@extension/core/options'
import type { OptionsControl } from '@extension/ui/options/Options'

export type OptionsViewState = {
  error: string | null
  openControl: OptionsControl | null
  scrollTop: number
}
export const createOptionsView = (initial: Partial<OptionsViewState> = {}) =>
  createStore<OptionsViewState>(() => ({
    error: null,
    openControl: null,
    scrollTop: 0,
    ...initial,
  }))
export type OptionsView = ReturnType<typeof createOptionsView>

export const createOptionsController = (
  preferences: PreferenceResource,
  resource: OptionsResource,
  view: OptionsView,
) => {
  let generation = 0
  const run = async (action: () => Promise<void>) => {
    const operation = generation
    view.setState({ error: null })
    try {
      await action()
    } catch (error: unknown) {
      if (operation === generation)
        view.setState({
          error: error instanceof Error ? error.message : String(error),
        })
    }
  }
  return {
    change: (patch: Partial<PreferenceState>) =>
      run(() => preferences.set(patch)),
    reset: () => run(() => preferences.reset()),
    openShortcuts: () => run(resource.openShortcutsSettings),
    openAppearance: () => run(resource.openSidePanelSettings),
    cancel: () => {
      generation++
    },
  }
}

export const OptionsExperience = ({
  urlSeasonalIcons = false,
}: {
  urlSeasonalIcons?: boolean
}) => {
  const resources = useTabbyResources()
  const resource = resources.options
  const view = resources.views.options
  const preferences = useSyncExternalStore(
    resources.preferences.subscribe,
    resources.preferences.getSnapshot,
    resources.preferences.getSnapshot,
  )
  const locale =
    resources.environment.locale ??
    (typeof navigator === 'undefined' ? 'en-US' : navigator.language)
  const selectSeasonalIcon = useCallback(
    (time: number) =>
      getThemeIconId(preferences) ??
      getUpcomingSeasonalIcon(preferences, new Date(time), locale)?.iconId,
    [locale, preferences],
  )
  const now = useExperienceClock(resources.environment, selectSeasonalIcon)
  const seasonalIconId = selectSeasonalIcon(now)
  const state = useStore(view)
  const metadata = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  const controller = useMemo(
    () => createOptionsController(resources.preferences, resource, view),
    [resources.preferences, resource, view],
  )
  useEffect(() => () => controller.cancel(), [controller])
  const shortcutRows = [
    {
      id: 'open-omnibar',
      name: 'Open Tabby search',
      description:
        'Opens the standard extension popup for tabs, bookmarks, and history',
      shortcut: metadata.shortcuts['open-omnibar'],
    },
    {
      id: 'open-tab-manager',
      name: 'Open tab manager',
      description: 'Opens the side panel',
      shortcut: metadata.shortcuts['open-tab-manager'],
    },
    ...Array.from({ length: 10 }, (_, index) => ({
      id: `focus-window-${index + 1}`,
      name: `Focus window ${index + 1}`,
      description: 'Focuses the numbered window and keeps its current tab',
      shortcut:
        metadata.shortcuts[
          `focus-window-${String(index + 1).padStart(2, '0')}`
        ],
    })),
  ]
  const iconPath = `/seasonal-icons/${seasonalIconId}-128.png`
  const logoUrl =
    seasonalIconId && metadata.logoUrl
      ? URL.canParse(metadata.logoUrl)
        ? new URL(iconPath, metadata.logoUrl).href
        : iconPath
      : metadata.logoUrl
  return (
    <Options
      urlSeasonalIcons={urlSeasonalIcons}
      preferences={preferences}
      activeThemeMode={
        preferences.theme === 'system'
          ? resources.environment.systemTheme
          : preferences.theme
      }
      isMac={metadata.isMac}
      logoUrl={logoUrl}
      shortcutRows={shortcutRows}
      shortcutsLoading={metadata.status === 'loading'}
      error={state.error ?? metadata.error}
      openControl={state.openControl}
      onOpenControlChange={(openControl) => view.setState({ openControl })}
      scrollTop={state.scrollTop}
      onScrollChange={(scrollTop) => view.setState({ scrollTop })}
      onPreferenceChange={controller.change}
      resetPreferences={() => {
        void controller.reset()
      }}
      openShortcutsSettings={() => {
        void controller.openShortcuts()
      }}
      openSidePanelSettings={() => {
        void controller.openAppearance()
      }}
    />
  )
}
