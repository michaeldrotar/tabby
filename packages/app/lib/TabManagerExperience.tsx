import { useSurface } from '@extension/ui/Surface'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import { useShouldReduceMotion } from '@extension/ui/useShouldReduceMotion'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { useStore } from 'zustand'
import { useTabbyPreferences, useTabManagerResources } from './TabbyProvider'
import {
  createTabManagerController,
  projectTabManager,
} from './tabManagerModel'
import { useExperienceClock } from './useExperienceClock'
import type { TabManagerController } from './tabManagerModel'

export const TabManagerExperience = ({
  controller: supplied,
  focusOnMount,
}: {
  controller?: TabManagerController
  focusOnMount?: boolean
}) => {
  const resources = useTabManagerResources()
  const appearance = useTabbyPreferences()
  const { backend, view, environment, preferences, host } = resources
  const now = useExperienceClock(environment)
  const reduceAgePrecision = !!useShouldReduceMotion()
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const snapshot = useSyncExternalStore(
    backend.subscribe,
    backend.getSnapshot,
    backend.getSnapshot,
  )
  const state = useStore(view)
  const controller = useMemo(
    () =>
      supplied ??
      createTabManagerController({
        backend,
        view,
        environment,
        preferences,
        host,
      }),
    [supplied, backend, view, environment, preferences, host],
  )
  useLayoutEffect(() => {
    controller.reconcile()
  }, [controller, snapshot])
  useEffect(() => {
    if (live) controller.startNotifications()
    else controller.cancel()
    return () => controller.cancel()
  }, [controller, live])
  const model = {
    ...projectTabManager(snapshot, state, now, {
      identificationMode: appearance.tabManagerCompactIconMode,
      compactLayout: appearance.tabManagerCompactLayout,
      reduceAgePrecision,
      isMac: environment.platform === 'mac',
    }),
    compactIconMode: appearance.tabManagerCompactIconMode,
    compactLayout: appearance.tabManagerCompactLayout,
  }
  return (
    <TabManager
      model={model}
      onIntent={controller.dispatch}
      focusOnMount={focusOnMount}
    />
  )
}
