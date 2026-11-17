import { useSurface } from '@extension/ui/Surface'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { useStore } from 'zustand'
import { DiscoveryExperience } from './DiscoveryExperience'
import { useTabManagerResources } from './TabbyProvider'
import {
  createTabManagerController,
  projectTabManager,
} from './tabManagerModel'
import type { TabManagerController } from './tabManagerModel'

export const TabManagerExperience = ({
  controller: supplied,
  focusOnMount,
}: {
  controller?: TabManagerController
  focusOnMount?: boolean
}) => {
  const resources = useTabManagerResources()
  const { backend, view, environment, preferences, host, discovery } = resources
  const surface = useSurface()
  const live = !surface || surface.inputMode === 'live'
  const snapshot = useSyncExternalStore(
    backend.subscribe,
    backend.getSnapshot,
    backend.getSnapshot,
  )
  const preferenceState = useSyncExternalStore(
    preferences.subscribe,
    preferences.getSnapshot,
    preferences.getSnapshot,
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
        discovery,
      }),
    [supplied, backend, view, environment, preferences, host, discovery],
  )
  useLayoutEffect(() => {
    controller.reconcile()
  }, [controller, snapshot])
  useEffect(() => {
    if (live) controller.startNotifications()
    else controller.cancel()
    return () => controller.cancel()
  }, [controller, live])
  const model = projectTabManager(
    snapshot,
    state,
    {
      windowSource: preferenceState.tabManagerCompactIconMode,
    },
    controller.getPreviousSnapshot(),
  )
  return (
    <>
      <TabManager
        model={{
          ...model,
          currentWindowId: host?.getCurrentWindowId?.(),
          windowClickBehavior: preferenceState.tabManagerWindowClickBehavior,
        }}
        onIntent={controller.dispatch}
        focusOnMount={focusOnMount}
      />
      <DiscoveryExperience
        area="tab-manager"
        ready={snapshot.state === 'loaded'}
      />
    </>
  )
}
