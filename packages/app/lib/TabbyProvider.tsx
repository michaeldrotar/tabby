import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import { PreferenceSurface, resolveTheme } from './PreferenceSurface'
import type { OmnibarView } from './OmnibarExperience'
import type { OptionsView } from './OptionsExperience'
import type { TabManagerView } from './view'
import type {
  BrowserBackend,
  HostCapabilities,
  OmnibarResource,
  OptionsResource,
  PreferenceResource,
} from '@extension/core'
import type { SurfaceProps } from '@extension/ui/Surface'
import type { PropsWithChildren } from 'react'

export type TabbyEnvironment = {
  now: () => number
  schedule?: (callback: () => void, delay: number) => () => void
  systemTheme: 'light' | 'dark'
  platform?: 'mac' | 'other'
  random?: () => number
}

export type TabManagerResources = {
  backend: BrowserBackend
  view: TabManagerView
  preferences: PreferenceResource
  environment: TabbyEnvironment
  host?: HostCapabilities
}

export type TabbyViews = {
  tabManager: TabManagerView
  omnibar: OmnibarView
  options: OptionsView
}

export type TabbyResources = Omit<TabManagerResources, 'view'> & {
  omnibar: OmnibarResource
  options: OptionsResource
  views: TabbyViews
}

const TabbyContext = createContext<TabbyResources | null>(null)

export const TabbyProvider = ({
  children,
  ...resources
}: PropsWithChildren<TabbyResources>) => {
  const { backend, views, omnibar, options, preferences, environment, host } =
    resources
  const value = useMemo(
    () => ({
      backend,
      views,
      omnibar,
      options,
      preferences,
      environment,
      host,
    }),
    [backend, views, omnibar, options, preferences, environment, host],
  )
  return <TabbyContext.Provider value={value}>{children}</TabbyContext.Provider>
}

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
  return resolveTheme(preferences, environment.systemTheme)
}

export const useTabManagerResources = (): TabManagerResources => {
  const { backend, views, preferences, environment, host } = useTabbyResources()
  const view = views.tabManager
  return useMemo(
    () => ({ backend, view, preferences, environment, host }),
    [backend, view, preferences, environment, host],
  )
}

export const TabbySurface = (props: Omit<SurfaceProps, 'palette'>) => {
  const { preferences, environment } = useTabbyResources()
  return (
    <PreferenceSurface
      {...props}
      preferences={preferences}
      systemTheme={environment.systemTheme}
    />
  )
}
