import {
  THEME_ACCENT_PALETTES,
  THEME_ACCENT_STRENGTH_OPTIONS,
  THEME_NEUTRAL_PALETTES,
} from '@extension/core'
import { Options } from '@extension/ui/options/Options'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { useTabbyResources } from './TabbyProvider'
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
  systemTheme: () => 'light' | 'dark',
  random: () => number = Math.random,
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
  const different = <T,>(current: T, options: readonly T[]): T => {
    const choices = options.filter((option) => option !== current)
    return (
      choices[
        Math.min(
          choices.length - 1,
          Math.max(0, Math.floor(random() * choices.length)),
        )
      ] ?? current
    )
  }
  return {
    change: (patch: Partial<PreferenceState>) =>
      run(() => preferences.set(patch)),
    reset: () => run(() => preferences.reset()),
    randomize: () =>
      run(() => {
        const state = preferences.getSnapshot()
        const mode = state.theme === 'system' ? systemTheme() : state.theme
        const prefix = mode === 'light' ? 'themeLight' : 'themeDark'
        return preferences.set({
          [`${prefix}Background`]: different(
            state[`${prefix}Background`],
            THEME_NEUTRAL_PALETTES,
          ),
          [`${prefix}Foreground`]: different(
            state[`${prefix}Foreground`],
            THEME_NEUTRAL_PALETTES,
          ),
          [`${prefix}Accent`]: different(
            state[`${prefix}Accent`],
            THEME_ACCENT_PALETTES,
          ),
          [`${prefix}AccentStrength`]: different(
            state[`${prefix}AccentStrength`],
            THEME_ACCENT_STRENGTH_OPTIONS,
          ),
        })
      }),
    openShortcuts: () => run(resource.openShortcutsSettings),
    openAppearance: () => run(resource.openSidePanelSettings),
    cancel: () => {
      generation++
    },
  }
}

export const OptionsExperience = () => {
  const resources = useTabbyResources()
  const resource = resources.options
  const view = resources.views.options
  const random = resources.environment.random
  const preferences = useSyncExternalStore(
    resources.preferences.subscribe,
    resources.preferences.getSnapshot,
    resources.preferences.getSnapshot,
  )
  const state = useStore(view)
  const metadata = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  )
  const controller = useMemo(
    () =>
      createOptionsController(
        resources.preferences,
        resource,
        view,
        () => resources.environment.systemTheme,
        random,
      ),
    [resources.preferences, resources.environment, resource, view, random],
  )
  useEffect(() => () => controller.cancel(), [controller])
  const shortcutRows = [
    {
      id: 'open-omnibar',
      name: 'Open Tabby Search',
      description:
        'Opens the standard extension popup for tabs, bookmarks, and history',
      shortcut: metadata.shortcuts['open-omnibar'],
    },
    {
      id: 'open-tab-manager',
      name: 'Open Tab Manager',
      description: 'Opens the side panel',
      shortcut: metadata.shortcuts['open-tab-manager'],
    },
    ...Array.from({ length: 10 }, (_, index) => ({
      id: `focus-window-${index + 1}`,
      name: `Focus Window ${index + 1}`,
      description: 'Focuses the numbered window and keeps its current tab',
      shortcut:
        metadata.shortcuts[
          `focus-window-${String(index + 1).padStart(2, '0')}`
        ],
    })),
  ]
  return (
    <Options
      preferences={preferences}
      activeThemeMode={
        preferences.theme === 'system'
          ? resources.environment.systemTheme
          : preferences.theme
      }
      isMac={metadata.isMac}
      logoUrl={metadata.logoUrl}
      shortcutRows={shortcutRows}
      shortcutsLoading={metadata.status === 'loading'}
      error={state.error ?? metadata.error}
      openControl={state.openControl}
      onOpenControlChange={(openControl) => view.setState({ openControl })}
      scrollTop={state.scrollTop}
      onScrollChange={(scrollTop) => view.setState({ scrollTop })}
      onPreferenceChange={controller.change}
      randomizeColors={() => {
        void controller.randomize()
      }}
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
