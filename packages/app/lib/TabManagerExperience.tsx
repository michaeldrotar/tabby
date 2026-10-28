import { useSurface } from '@extension/ui/Surface'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import { TabManagerWorkspace } from '@extension/ui/tab-manager/TabManagerWorkspace'
import { useShouldReduceMotion } from '@extension/ui/useShouldReduceMotion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import { useStore } from 'zustand'
import { RecentlyClosedExperience } from './RecentlyClosedExperience'
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
      className={resources.recentlyClosed ? 'h-full' : undefined}
    />
  )
  if (!resources.recentlyClosed) return tabs
  const changePane = (pane: string) =>
    view.setState({
      pane,
      hasUserInput: true,
      actionMenu: null,
      actionPanel: null,
      scrollToItem: null,
    })
  return (
    <TabManagerWorkspace
      value={state.pane}
      onChange={changePane}
      panes={[
        { id: 'tabs', label: 'Tabs and windows', content: tabs },
        {
          id: 'recently-closed',
          label: 'Recently closed',
          content: (
            <RecentlyClosedExperience
              resource={resources.recentlyClosed}
              locale={environment.locale}
              onIntent={(intent) => {
                if (live) void controller.dispatch(intent)
              }}
            />
          ),
        },
      ]}
    />
  )
}
