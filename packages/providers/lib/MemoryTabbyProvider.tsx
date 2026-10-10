import {
  createTabbyViews,
  initializeTabManagerView,
  TabbyProvider,
} from '@extension/app'
import {
  createMemoryTabbyBackend,
  createMemoryTabbyOmnibar,
  createMemoryTabbyOptions,
  createMemoryTabbyPreferences,
  memorySceneTime,
} from '@extension/demo'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import type { TabbyEnvironment, TabbyViews } from '@extension/app'
import type { HostCapabilities } from '@extension/core'
import type { MemoryTabbyDataOptions } from '@extension/demo'
import type { PropsWithChildren } from 'react'

const useStableData = <T,>(value: T): T => {
  const serialized = JSON.stringify(value)
  const [cached, setCached] = useState(() => ({ serialized, value }))
  if (cached.serialized !== serialized) {
    setCached({ serialized, value })
    return value
  }
  return cached.value
}

const createMemoryClock = (initialTime: number) => {
  const startedAt = Date.now()
  return {
    now: () => initialTime + Date.now() - startedAt,
    schedule: (callback: () => void, delay: number) => {
      const timer = setTimeout(callback, delay)
      return () => clearTimeout(timer)
    },
  }
}

const useOwnedResource = (
  resource: { start: () => Promise<void>; dispose: () => void },
  external: unknown,
  onError: (error: unknown) => void,
) => {
  const notifyError = useEffectEvent(onError)
  useEffect(() => {
    if (resource === external) return
    let live = true
    void resource.start().catch((error: unknown) => {
      if (live) notifyError(error)
    })
    return () => {
      live = false
      resource.dispose()
    }
  }, [resource, external])
}

export type MemoryTabbyProviderProps = PropsWithChildren<
  MemoryTabbyDataOptions & {
    views?: Partial<TabbyViews>
    environment?: Partial<TabbyEnvironment>
    host?: HostCapabilities
  }
>

/** Creates complete demo defaults and leaves injected resource handles under their owner's control. */
export const MemoryTabbyProvider = ({
  children,
  scene,
  overrides,
  preferences,
  resources: injected,
  omnibar,
  optionsMetadata,
  optionsHost,
  commands,
  views: injectedViews,
  environment: injectedEnvironment,
  host,
}: MemoryTabbyProviderProps) => {
  const {
    backend: injectedBackend,
    preferences: injectedPreferences,
    omnibar: injectedOmnibar,
    options: injectedOptions,
  } = injected ?? {}
  const {
    tabManager: injectedTabManagerView,
    omnibar: injectedOmnibarView,
    options: injectedOptionsView,
  } = injectedViews ?? {}
  const stableScene = useStableData(scene)
  const stableOverrides = useStableData(overrides)
  const stablePreferences = useStableData(preferences)
  const stableOptionsMetadata = useStableData(optionsMetadata)
  const backend = useMemo(
    () =>
      createMemoryTabbyBackend({
        scene: stableScene,
        overrides: stableOverrides,
        resources: { backend: injectedBackend },
        commands,
      }),
    [stableScene, stableOverrides, injectedBackend, commands],
  )
  const preferenceResource = useMemo(
    () =>
      createMemoryTabbyPreferences({
        preferences: stablePreferences,
        resources: { preferences: injectedPreferences },
      }),
    [stablePreferences, injectedPreferences],
  )
  const isMac = stableOptionsMetadata?.isMac
  const omnibarResource = useMemo(
    () =>
      createMemoryTabbyOmnibar(backend, {
        omnibar,
        optionsMetadata: { isMac },
        commands,
        resources: { omnibar: injectedOmnibar },
      }),
    [backend, omnibar, isMac, commands, injectedOmnibar],
  )
  const omnibarIsMac = omnibar?.isMac
  const optionsResource = useMemo(
    () =>
      createMemoryTabbyOptions({
        omnibar: { isMac: omnibarIsMac },
        optionsMetadata: stableOptionsMetadata,
        optionsHost,
        resources: { options: injectedOptions },
      }),
    [omnibarIsMac, stableOptionsMetadata, optionsHost, injectedOptions],
  )
  const ownedViews = useMemo(() => {
    const created = createTabbyViews()
    initializeTabManagerView(created.tabManager, backend.getSnapshot())
    return created
  }, [backend])
  const views = useMemo(
    () => ({
      tabManager: injectedTabManagerView ?? ownedViews.tabManager,
      omnibar: injectedOmnibarView ?? ownedViews.omnibar,
      options: injectedOptionsView ?? ownedViews.options,
    }),
    [
      ownedViews,
      injectedTabManagerView,
      injectedOmnibarView,
      injectedOptionsView,
    ],
  )
  const resources = {
    backend,
    preferences: preferenceResource,
    omnibar: omnibarResource,
    options: optionsResource,
    views,
  }
  const clock = useMemo(
    () => createMemoryClock(stableOverrides?.now ?? memorySceneTime),
    // Restart the live clock when the owned browser scene changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backend, stableOverrides],
  )
  const environment = useMemo<TabbyEnvironment>(
    () => ({
      ...clock,
      systemTheme: 'light',
      ...injectedEnvironment,
    }),
    [clock, injectedEnvironment],
  )
  const notifyError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    views.omnibar.setState({ error: message })
    views.options.setState({ error: message })
  }
  useOwnedResource(backend, injectedBackend, notifyError)
  useOwnedResource(preferenceResource, injectedPreferences, notifyError)
  useOwnedResource(omnibarResource, injectedOmnibar, notifyError)
  useOwnedResource(optionsResource, injectedOptions, notifyError)
  return (
    <TabbyProvider {...resources} environment={environment} host={host}>
      {children}
    </TabbyProvider>
  )
}
