import { useSurface, useSurfaceId } from '@extension/ui/Surface'
import { ManagerPaneSwitcher } from '@extension/ui/tab-manager/ManagerPaneSwitcher'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import { useShouldReduceMotion } from '@extension/ui/useShouldReduceMotion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { useStore } from 'zustand'
import { RecentDownloadsExperience } from './RecentDownloadsExperience'
import { useTabManagerResources } from './TabbyProvider'
import {
  createTabManagerController,
  projectTabManager,
  projectTabManagerWindows,
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
  const { backend, view, environment, preferences, host } = resources
  const reduceAgePrecision = !!useShouldReduceMotion()
  const surface = useSurface()
  const paneId = useSurfaceId('manager-pane')
  const live = !surface || surface.inputMode === 'live'
  const snapshot = useSyncExternalStore(
    backend.subscribe,
    backend.getSnapshot,
    backend.getSnapshot,
  )
  const selectClock = useCallback(
    (time: number) =>
      projectTabManagerWindows(snapshot, time, reduceAgePrecision).clockKey,
    [snapshot, reduceAgePrecision],
  )
  const now = useExperienceClock(environment, selectClock)
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
  const model = projectTabManager(
    snapshot,
    state,
    now,
    {
      reduceAgePrecision,
      windowSource: preferenceState.tabManagerCompactIconMode,
    },
    controller.getPreviousSnapshot(),
  )
  const tabs = (
    <TabManager
      model={model}
      onIntent={controller.dispatch}
      focusOnMount={focusOnMount}
    />
  )
  if (!resources.downloads) return tabs
  return (
    <div data-manager-panes className="flex h-full min-h-0 flex-col">
      <ManagerPaneSwitcher
        id={paneId}
        active={state.pane}
        onChange={(pane) =>
          view.setState({
            pane,
            actionMenu: null,
            actionPanel: null,
            downloadsMenu: null,
          })
        }
      />
      <div
        role="tabpanel"
        id={`${paneId}-tabs-panel`}
        aria-labelledby={`${paneId}-tabs`}
        hidden={state.pane !== 'tabs'}
        className="min-h-0 flex-1"
      >
        {state.pane === 'tabs' ? tabs : null}
      </div>
      <div
        role="tabpanel"
        id={`${paneId}-downloads-panel`}
        aria-labelledby={`${paneId}-downloads`}
        hidden={state.pane !== 'downloads'}
        className="min-h-0 flex-1"
      >
        <RecentDownloadsExperience
          view={view}
          resource={resources.downloads}
          active={state.pane === 'downloads'}
          onOpenSearch={() => controller.dispatch({ type: 'open-search' })}
          onOpenOptions={() => controller.dispatch({ type: 'open-settings' })}
        />
      </div>
    </div>
  )
}
