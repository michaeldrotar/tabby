import { createContext, useContext, useSyncExternalStore } from 'react'
import type { TabManagerView } from './view'
import type {
  BrowserBackend,
  HostCapabilities,
  PreferenceResource,
} from '@extension/core'
import type { PropsWithChildren } from 'react'

export type TabbyEnvironment = {
  now: () => number
  systemTheme: 'light' | 'dark'
}

export type TabbyResources = {
  backend: BrowserBackend
  view: TabManagerView
  preferences: PreferenceResource
  environment: TabbyEnvironment
  host?: HostCapabilities
}

const TabbyContext = createContext<TabbyResources | null>(null)

export const TabbyProvider = ({
  children,
  ...resources
}: PropsWithChildren<TabbyResources>) => (
  <TabbyContext.Provider value={resources}>{children}</TabbyContext.Provider>
)

export const useTabbyResources = () => {
  const resources = useContext(TabbyContext)
  if (!resources) throw new Error('A TabbyProvider is required.')
  return resources
}

export const useTabbyPreferences = () => {
  const { preferences } = useTabbyResources()
  return useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
    preferences.getSnapshot,
  )
}

export const useTabbyTheme = () => {
  const preferences = useTabbyPreferences()
  const { environment } = useTabbyResources()
  const theme =
    preferences.theme === 'system' ? environment.systemTheme : preferences.theme
  return {
    theme,
    background:
      theme === 'light'
        ? preferences.themeLightBackground
        : preferences.themeDarkBackground,
    foreground:
      theme === 'light'
        ? preferences.themeLightForeground
        : preferences.themeDarkForeground,
    accent:
      theme === 'light'
        ? preferences.themeLightAccent
        : preferences.themeDarkAccent,
    strength:
      theme === 'light'
        ? preferences.themeLightAccentStrength
        : preferences.themeDarkAccentStrength,
  }
}
