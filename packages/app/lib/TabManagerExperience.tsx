import { useSurface } from '@extension/ui/Surface'
import { BookmarkManager } from '@extension/ui/tab-manager/BookmarkManager'
import { TabManager } from '@extension/ui/tab-manager/TabManager'
import { ManagerViewSwitch } from '@extension/ui/tab-manager/ui/ManagerViewSwitch'
import { useShouldReduceMotion } from '@extension/ui/useShouldReduceMotion'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { useStore } from 'zustand'
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
  const [section, setSection] = useState<'tabs' | 'bookmarks'>('tabs')
  const [restoreViewFocus, setRestoreViewFocus] = useState(false)
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
  const navigation = resources.bookmarks ? (
    <ManagerViewSwitch
      view={section}
      disabled={!live}
      restoreFocus={restoreViewFocus}
      onChange={(view) => {
        setRestoreViewFocus(true)
        setSection(view)
      }}
    />
  ) : undefined
  const manager = (
    <TabManager
      model={model}
      onIntent={controller.dispatch}
      focusOnMount={focusOnMount && !restoreViewFocus}
      navigation={navigation}
    />
  )
  if (!resources.bookmarks || section === 'tabs') return manager
  return (
    <div className="h-full min-h-0" inert={!live || undefined}>
      <BookmarkExperience
        actions={resources.bookmarks}
        windows={model.windows}
        windowId={model.viewedWindowId}
        currentWindowId={host?.getCurrentWindowId?.()}
        navigation={navigation}
        onSearch={() => {
          void controller.dispatch({ type: 'open-search' })
        }}
        onSettings={() => {
          void controller.dispatch({ type: 'open-settings' })
        }}
      />
    </div>
  )
}

const BookmarkExperience = ({
  actions,
  ...props
}: Omit<Parameters<typeof BookmarkManager>[0], 'snapshot'>) => {
  const snapshot = useSyncExternalStore(
    actions.subscribe,
    actions.getSnapshot,
    actions.getSnapshot,
  )
  return <BookmarkManager snapshot={snapshot} actions={actions} {...props} />
}
