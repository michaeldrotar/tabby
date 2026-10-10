import {
  createTabManagerView,
  TabbyProvider,
  TabManagerExperience,
  useTabbyTheme,
} from '@extension/app'
import { createChromeBackend } from '@extension/chrome/createChromeBackend'
import { createChromePreferences } from '@extension/chrome/createChromePreferences'
import { Surface } from '@extension/ui/Surface'
import { useEffect, useState } from 'react'
import type { TabbyResources } from '@extension/app'

const Experience = () => {
  const theme = useTabbyTheme()
  return (
    <Surface
      instanceId="extension-tab-manager"
      theme={theme.theme}
      palette={theme}
      style={{ height: '100dvh' }}
    >
      <TabManagerExperience />
    </Surface>
  )
}

/** Explicit local composition for exercising the provider with Chrome. */
export const Root = () => {
  const [resources] = useState<TabbyResources>(() => ({
    backend: createChromeBackend(chrome),
    preferences: createChromePreferences(chrome),
    view: createTabManagerView(),
    environment: {
      now: Date.now,
      systemTheme: matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light',
    },
  }))
  useEffect(() => {
    void Promise.all([resources.backend.start(), resources.preferences.start()])
    return () => {
      resources.backend.dispose()
      resources.preferences.dispose()
    }
  }, [resources])
  return (
    <TabbyProvider {...resources}>
      <Experience />
    </TabbyProvider>
  )
}
